//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

/**
 * @title AdminRole
 * @dev Contract to manage different admin roles with voting mechanism
 */
contract AdminRole {
    // Admin mappings
    mapping(address => bool) public mintingAdmins;
    mapping(address => bool) public restrAdmins;
    mapping(address => bool) public idpAdmins;

    // Counters for each admin type
    uint256 public mintingAdminCount;
    uint256 public restrAdminCount;
    uint256 public idpAdminCount;

    // Admin voting systems
    mapping(address => mapping(address => bool)) public mintingAdminVotes; // Fixed typo from mintinAdminVotes
    mapping(address => mapping(address => bool)) public restrAdminVotes;
    mapping(address => mapping(address => bool)) public idpAdminVotes;

    mapping(address => address[]) public mintingAdminVotesList;
    mapping(address => address[]) public restrAdminVotesList;
    mapping(address => address[]) public idpAdminVotesList;

    // Events
    event AdminStatusChanged(
        address indexed admin,
        string adminType,
        bool isAdmin
    );

    constructor(
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins
    ) {
        // Initialize minting admins
        for (uint256 i = 0; i < _mintingAdmins.length; i++) {
            mintingAdmins[_mintingAdmins[i]] = true;
        }
        mintingAdminCount = _mintingAdmins.length;

        // Initialize restriction admins
        for (uint256 i = 0; i < _restrAdmins.length; i++) {
            restrAdmins[_restrAdmins[i]] = true;
        }
        restrAdminCount = _restrAdmins.length;

        // Initialize identity provider admins
        for (uint256 i = 0; i < _idpAdmins.length; i++) {
            idpAdmins[_idpAdmins[i]] = true;
        }
        idpAdminCount = _idpAdmins.length;
    }

    // Admin role modifiers
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

    // Admin voting functions
    function voteMintingAdmin(address user) external onlyMintingAdmin {
        require(!mintingAdminVotes[user][msg.sender], "Already voted");
        require(msg.sender != user, "Cannot vote for yourself");
        mintingAdminVotes[user][msg.sender] = true;
        mintingAdminVotesList[user].push(msg.sender);

        if (mintingAdminVotesList[user].length > mintingAdminCount / 2) {
            bool newStatus = !mintingAdmins[user];
            mintingAdmins[user] = newStatus;
            if (newStatus) mintingAdminCount++;
            else mintingAdminCount--;

            // Reset votes
            for (uint256 i = 0; i < mintingAdminVotesList[user].length; i++) {
                mintingAdminVotes[user][mintingAdminVotesList[user][i]] = false;
            }
            delete mintingAdminVotesList[user];

            emit AdminStatusChanged(user, "minting", newStatus);
        }
    }

    function voteRestrAdmin(address user) external onlyRestrAdmin {
        require(!restrAdminVotes[user][msg.sender], "Already voted");
        require(msg.sender != user, "Cannot vote for yourself");
        restrAdminVotes[user][msg.sender] = true;
        restrAdminVotesList[user].push(msg.sender);

        if (restrAdminVotesList[user].length > restrAdminCount / 2) {
            bool newStatus = !restrAdmins[user];
            restrAdmins[user] = newStatus;
            if (newStatus) restrAdminCount++;
            else restrAdminCount--;

            // Reset votes
            for (uint256 i = 0; i < restrAdminVotesList[user].length; i++) {
                restrAdminVotes[user][restrAdminVotesList[user][i]] = false;
            }
            delete restrAdminVotesList[user];

            emit AdminStatusChanged(user, "restriction", newStatus);
        }
    }

    function voteIDPAdmin(address user) external onlyIDPAdmin {
        require(!idpAdminVotes[user][msg.sender], "Already voted");
        require(msg.sender != user, "Cannot vote for yourself");
        idpAdminVotes[user][msg.sender] = true;
        idpAdminVotesList[user].push(msg.sender);

        if (idpAdminVotesList[user].length > idpAdminCount / 2) {
            bool newStatus = !idpAdmins[user];
            idpAdmins[user] = newStatus;
            if (newStatus) idpAdminCount++;
            else idpAdminCount--;

            // Reset votes
            for (uint256 i = 0; i < idpAdminVotesList[user].length; i++) {
                idpAdminVotes[user][idpAdminVotesList[user][i]] = false;
            }
            delete idpAdminVotesList[user];

            emit AdminStatusChanged(user, "identityProvider", newStatus);
        }
    }
}
