//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract BDAERC20 is ERC20 {
    using ECDSA for bytes32;

    uint256 public immutable maxSupply;

    mapping(address => bool) public mintingAdmins;
    mapping(address => bool) public restrAdmins;
    mapping(address => bool) public idpAdmins;
    // Counters for each admin type
    uint256 public mintingAdminCount;
    uint256 public restrAdminCount;
    uint256 public idpAdminCount;

    uint256 public immutable maxDailyMint;
    mapping(address => uint256) public dailyMintedAmount;
    mapping(address => uint256) public lastDailyMintResetTimestamp;

    mapping(address => uint256) public dailyTransferLimit;
    mapping(address => uint256) public dailyTransferredAmount;
    mapping(address => uint256) public lastTransferResetTimestamp;

    // Identity verification related variables
    mapping(address => bool) public trustedIdentityProviders;
    mapping(address => uint256) public verifiedAddresses; // Maps address to verification timestamp
    mapping(address => bool) public blockedAddresses; // Maps address to blocked status
    uint256 public immutable expirationTime;

    mapping(address => mapping(address => bool)) public mintinAdminVotes;
    mapping(address => mapping(address => bool)) public restrAdminVotes;
    mapping(address => mapping(address => bool)) public idpAdminVotes;

    mapping(address => address[]) public mintingAdminVotesList;
    mapping(address => address[]) public restrAdminVotesList;
    mapping(address => address[]) public idpAdminVotesList;

    mapping(address => uint256) public mintingAdminVotesCount;
    mapping(address => uint256) public restrAdminVotesCount;
    mapping(address => uint256) public idpAdminVotesCount;

    event TokensMinted(address indexed to, uint256 amount);
    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event TransferRestrictionCreated(address indexed user);
    event TransferRestrictionRemoved(address indexed user);

    constructor(
        uint256 _maxSupply,
        uint256 _maxDailyMint,
        uint256 _expirationTime,
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins,
        address[] memory _identityProviders
    ) ERC20("BDA25 Token", "BDA25") {
        maxSupply = _maxSupply;
        maxDailyMint = _maxDailyMint;
        expirationTime = _expirationTime;

        for (uint256 i = 0; i < _mintingAdmins.length; i++) {
            mintingAdmins[_mintingAdmins[i]] = true;
        }
        mintingAdminCount = _mintingAdmins.length;

        for (uint256 i = 0; i < _restrAdmins.length; i++) {
            restrAdmins[_restrAdmins[i]] = true;
        }
        restrAdminCount = _restrAdmins.length;

        for (uint256 i = 0; i < _idpAdmins.length; i++) {
            idpAdmins[_idpAdmins[i]] = true;
        }
        idpAdminCount = _idpAdmins.length;

        for (uint256 i = 0; i < _identityProviders.length; i++) {
            trustedIdentityProviders[_identityProviders[i]] = true;
        }
    }

    modifier onlyAdmin() {
        require(
            mintingAdmins[msg.sender] ||
                restrAdmins[msg.sender] ||
                idpAdmins[msg.sender],
            "Not an admin"
        );
        _;
    }

    modifier onlyMintingAdmin() {
        require(mintingAdmins[msg.sender], "Not a minting admin");
        _;
    }

    modifier onlyRestrAdmin() {
        require(restrAdmins[msg.sender], "Not a restriction admin");
        _;
    }

    modifier onlyIDPAdmin() {
        require(idpAdmins[msg.sender], "Not an identity provider admin");
        _;
    }

    modifier meetsLimit(uint256 amount, uint256 limit) {
        if (limit != 0) {
            require(amount <= limit, "Exceeds daily limit");
        }
        _;
    }

    modifier checkLimitRefresh(
        mapping(address => uint256) storage lastResetTimestamps,
        mapping(address => uint256) storage dailyAmount
    ) {
        if (lastResetTimestamps[msg.sender] + 1 days <= block.timestamp) {
            dailyAmount[msg.sender] = 0;
            lastResetTimestamps[msg.sender] = block.timestamp;
        }
        _;
    }

    modifier onlyVerified(address user) {
        require(isVerified(user), "Identity not verified");
        _;
    }

    function isVerified(address user) public view returns (bool) {
        // Check if the user is verified and if the verification has not expired
        if (verifiedAddresses[user] == 0) {
            return false;
        }

        if (block.timestamp > verifiedAddresses[user] + expirationTime) {
            return false;
        }

        if (blockedAddresses[user]) {
            return false;
        }
        return true;
    }

    function verifyIdentity(
        uint256 timestamp,
        bytes memory signature
    ) external {
        // Construct the message that should have been signed by an IDP
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "User with address ",
                msg.sender,
                " has verified their identity at ",
                timestamp
            )
        );

        // Convert hash to Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Recover signer from the signature
        address signer = ethSignedMessageHash.recover(signature);

        // Check if signer is a trusted identity provider
        require(
            trustedIdentityProviders[signer],
            "Invalid identity provider signature"
        );

        // Set verification timestamp
        verifiedAddresses[msg.sender] = timestamp;
    }

    function addIdentityProvider(address provider) external onlyIDPAdmin {
        trustedIdentityProviders[provider] = true;
    }

    function removeIdentityProvider(address provider) external onlyIDPAdmin {
        trustedIdentityProviders[provider] = false;
    }

    function blockAddress(address user) external onlyRestrAdmin {
        blockedAddresses[user] = true;
        emit TransferRestrictionCreated(user);
    }
    function unblockAddress(address user) external onlyRestrAdmin {
        blockedAddresses[user] = false;
        emit TransferRestrictionRemoved(user);
    }

    function addVerifiedAddress(
        address user,
        uint256 timestamp
    ) external onlyIDPAdmin {
        verifiedAddresses[user] = timestamp;
    }
    function removeVerifiedAddress(address user) external onlyIDPAdmin {
        verifiedAddresses[user] = 0;
    }

    function mint(
        address to,
        uint256 amount
    )
        external
        onlyMintingAdmin
        checkLimitRefresh(lastDailyMintResetTimestamp, dailyMintedAmount)
        meetsLimit(totalSupply() + amount, maxSupply)
        onlyVerified(to)
    {
        require(
            dailyMintedAmount[msg.sender] + amount <= maxDailyMint,
            "Exceeds daily mint limit"
        );
        _mint(to, amount);
        dailyMintedAmount[msg.sender] += amount;
        emit TokensMinted(to, amount);
    }

    function setDailyTransferLimit(
        address user,
        uint256 limit
    ) external onlyRestrAdmin {
        dailyTransferLimit[user] = limit;
    }

    function transfer(
        address from,
        address to,
        uint256 amount
    )
        external
        checkLimitRefresh(lastTransferResetTimestamp, dailyTransferredAmount)
        meetsLimit(
            dailyTransferredAmount[from] + amount,
            dailyTransferLimit[from]
        )
        onlyVerified(to)
    {
        _transfer(from, to, amount);
        dailyTransferredAmount[from] += amount;
        emit TokensTransferred(from, to, amount);
    }

    function voteMintingAdmin(address user) external onlyMintingAdmin {
        require(!mintinAdminVotes[user][msg.sender], "Already voted");
        mintinAdminVotes[msg.sender][user] = true;
        mintingAdminVotesCount[user] += 1;
        mintingAdminVotesList[user].push(msg.sender);
        if (mintingAdminVotesCount[user] > mintingAdminCount / 2) {
            mintingAdmins[user] = mintingAdmins[user] ? false : true;
            mintingAdminVotesCount[user] = 0;

            for (uint256 i = 0; i < mintingAdminVotesList[user].length; i++) {
                mintinAdminVotes[user][mintingAdminVotesList[user][i]] = false;
            }
            delete mintingAdminVotesList[user];
        }
    }

    function voteRestrAdmin(address user) external onlyRestrAdmin {
        require(!restrAdminVotes[user][msg.sender], "Already voted");
        restrAdminVotes[msg.sender][user] = true;
        restrAdminVotesCount[user] += 1;
        restrAdminVotesList[user].push(msg.sender);
        if (restrAdminVotesCount[user] > restrAdminCount / 2) {
            restrAdmins[user] = restrAdmins[user] ? false : true;
            restrAdminVotesCount[user] = 0;
            for (uint256 i = 0; i < restrAdminVotesList[user].length; i++) {
                restrAdminVotes[user][restrAdminVotesList[user][i]] = false;
            }
            delete restrAdminVotesList[user];
        }
    }

    function voteIDPAdmin(address user) external onlyIDPAdmin {
        require(!idpAdminVotes[user][msg.sender], "Already voted");
        idpAdminVotes[msg.sender][user] = true;
        idpAdminVotesCount[user] += 1;
        idpAdminVotesList[user].push(msg.sender);
        if (idpAdminVotesCount[user] > idpAdminCount / 2) {
            idpAdmins[user] = idpAdmins[user] ? false : true;
            idpAdminVotesCount[user] = 0;

            for (uint256 i = 0; i < idpAdminVotesList[user].length; i++) {
                idpAdminVotes[user][idpAdminVotesList[user][i]] = false;
            }
            delete idpAdminVotesList[user];
        }
    }
}
