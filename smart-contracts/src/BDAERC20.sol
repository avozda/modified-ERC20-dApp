//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

enum UserRole {
    mintingAdmin,
    restrAdmin,
    ipAdmin
}

contract BDAERC20 is ERC20 {
    using ECDSA for bytes32;

    uint256 public immutable maxSupply;
    mapping(address => UserRole) public userRoles;

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
        address[] memory _ipAdmins,
        address[] memory _identityProviders
    ) ERC20("BDA25 Token", "BDA25") {
        maxSupply = _maxSupply;
        maxDailyMint = _maxDailyMint;
        expirationTime = _expirationTime;

        for (uint256 i = 0; i < _mintingAdmins.length; i++) {
            userRoles[_mintingAdmins[i]] = UserRole.mintingAdmin;
        }
        for (uint256 i = 0; i < _restrAdmins.length; i++) {
            userRoles[_restrAdmins[i]] = UserRole.restrAdmin;
        }
        for (uint256 i = 0; i < _ipAdmins.length; i++) {
            userRoles[_ipAdmins[i]] = UserRole.ipAdmin;
        }
        for (uint256 i = 0; i < _identityProviders.length; i++) {
            trustedIdentityProviders[_identityProviders[i]] = true;
        }
    }

    modifier onlyMintingAdmin() {
        require(
            userRoles[msg.sender] == UserRole.mintingAdmin,
            "Not a minting admin"
        );
        _;
    }

    modifier onlyRestrAdmin() {
        require(
            userRoles[msg.sender] == UserRole.restrAdmin,
            "Not a restriction admin"
        );
        _;
    }

    modifier onlyIPAdmin() {
        require(
            userRoles[msg.sender] == UserRole.ipAdmin,
            "Not an identity provider admin"
        );
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

    function addIdentityProvider(address provider) external onlyIPAdmin {
        trustedIdentityProviders[provider] = true;
    }

    function removeIdentityProvider(address provider) external onlyIPAdmin {
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
    ) external onlyIPAdmin {
        verifiedAddresses[user] = timestamp;
    }
    function removeVerifiedAddress(address user) external onlyIPAdmin {
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
}
