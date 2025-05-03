//SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

/**
 * @title AdminRoles
 * @dev Contract to manage different admin roles with voting mechanism
 */
contract AdminRoles {
    mapping(address => bool) public mintingAdmins;
    mapping(address => bool) public restrAdmins;
    mapping(address => bool) public idpAdmins;

    uint256 public mintingAdminCount;
    uint256 public restrAdminCount;
    uint256 public idpAdminCount;

    mapping(address => mapping(address => bool)) public mintingAdminVotes;
    mapping(address => mapping(address => bool)) public restrAdminVotes;
    mapping(address => mapping(address => bool)) public idpAdminVotes;

    mapping(address => address[]) public mintingAdminVotesList;
    mapping(address => address[]) public restrAdminVotesList;
    mapping(address => address[]) public idpAdminVotesList;

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
    }

    /*
     * @dev Modifier to check if the caller is an admin
     * Requirements:
     * - The caller must be a minting admin, restriction admin, or identity provider admin
     */
    modifier onlyAdmin() {
        require(
            mintingAdmins[msg.sender] ||
                restrAdmins[msg.sender] ||
                idpAdmins[msg.sender],
            "Not an admin"
        );
        _;
    }

    /*
     * @dev Modifier to check if the caller is a minting admin
     * Requirements:
     * - The caller must be a minting admin
     */
    modifier onlyMintingAdmin() {
        require(mintingAdmins[msg.sender], "Not a minting admin");
        _;
    }

    /*
     * @dev Modifier to check if the caller is a restriction admin
     * Requirements:
     * - The caller must be a restriction admin
     */
    modifier onlyRestrAdmin() {
        require(restrAdmins[msg.sender], "Not a restriction admin");
        _;
    }

    /*
     * @dev Modifier to check if the caller is an identity provider admin
     * Requirements:
     * - The caller must be an identity provider admin
     */
    modifier onlyIDPAdmin() {
        require(idpAdmins[msg.sender], "Not an identity provider admin");
        _;
    }

    /*
     * @dev Allows minting admins to vote for a user to become a minting admin
     * @param user Address of the user to vote for
     * Emits an {AdminStatusChanged} event when the vote is successful
     * Requirements:
     * - The caller must be a minting admin
     * - The caller must not have already voted for the user
     * - The caller must not be voting for themselves
     */
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

    /*
     * @dev Allows restriction admins to vote for a user to become a restriction admin
     * @param user Address of the user to vote for
     * Emits an {AdminStatusChanged} event when the vote is successful
     * Requirements:
     * - The caller must be a restriction admin
     * - The caller must not have already voted for the user
     * - The caller must not be voting for themselves
     */
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

    /*
     * @dev Allows identity provider admins to vote for a user to become an identity provider admin
     * @param user Address of the user to vote for
     * Emits an {AdminStatusChanged} event when the vote is successful
     * Requirements:
     * - The caller must be an identity provider admin
     * - The caller must not have already voted for the user
     * - The caller must not be voting for themselves
     */
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
