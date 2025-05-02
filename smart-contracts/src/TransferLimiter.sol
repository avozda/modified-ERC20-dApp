//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "./IdentityVerification.sol";

/**
 * @title TransferLimiter
 * @dev Contract to manage transfer limits and restrictions
 */
contract TransferLimiter is IdentityVerification {
    // Daily transfer limit variables
    mapping(address => uint256) public dailyTransferLimit;
    mapping(address => uint256) public dailyTransferredAmount;
    address[] public balanceHolders;

    // Daily minting limit variables
    uint256 public immutable maxDailyMint;
    mapping(address => uint256) public dailyMintedAmount;

    uint256 public lastRefreshTimestamp;

    // Events
    event TransferLimitSet(address indexed user, uint256 limit);

    constructor(
        uint256 _maxDailyMint,
        uint256 _expirationTime,
        address[] memory _identityProviders,
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins
    )
        IdentityVerification(
            _expirationTime,
            _identityProviders,
            _mintingAdmins,
            _restrAdmins,
            _idpAdmins
        )
    {
        lastRefreshTimestamp = block.timestamp;
        maxDailyMint = _maxDailyMint;
    }

    /**
     * @dev Sets a daily transfer limit for a user
     * @param user Address to set the limit for
     * @param limit Daily transfer limit amount
     */
    function setDailyTransferLimit(
        address user,
        uint256 limit
    ) external onlyRestrAdmin {
        dailyTransferLimit[user] = limit;
        emit TransferLimitSet(user, limit);
    }

    /**
     * @dev Modifier to check if a transfer amount meets the daily limit
     * @param amount Amount to check
     * @param limit Limit to check against
     */
    modifier meetsLimit(uint256 amount, uint256 limit) {
        if (limit != 0) {
            require(amount <= limit, "Exceeds daily limit");
        }
        _;
    }

    /**
     * @dev Modifier to reset daily limits if a day has passed
     */
    modifier checkLimitRefresh() {
        if ((block.timestamp / 1 days) > (lastRefreshTimestamp / 1 days)) {
            lastRefreshTimestamp = block.timestamp;
            for (uint256 i = 0; i < balanceHolders.length; i++) {
                address user = balanceHolders[i];
                dailyTransferredAmount[user] = 0;
                dailyMintedAmount[user] = 0;
            }
        }
        _;
    }

    /**
     * @dev Updates the daily transferred amount for a specific address
     * @param from Address transferring tokens
     * @param amount Amount of tokens transferred
     */
    function updateDailyTransferred(address from, uint256 amount) internal {
        dailyTransferredAmount[from] += amount;
    }

    /**
     * @dev Updates the daily minted amount for an address
     * @param user Address to update
     * @param amount Amount to add to daily minted
     */
    function updateDailyMinted(address user, uint256 amount) internal {
        dailyMintedAmount[user] += amount;
    }

    /**
     * @dev Adds a user to the balance holders list
     * @param user Address to add
     */
    function addBalanceHolder(address user) internal {
        // Check if the user is already a balance holder
        require(verifiedAddresses[user] != 0, "User is not verified");
        require(!blockedAddresses[user], "User is blocked");
        balanceHolders.push(user);
    }

    /**
     * @dev Checks if an address is a balance holder
     * @param user Address to check
     * @return bool True if the address is a balance holder, false otherwise
     */
    function isBalanceHolder(address user) internal view returns (bool) {
        for (uint256 i = 0; i < balanceHolders.length; i++) {
            if (balanceHolders[i] == user) {
                return true;
            }
        }

        return false;
    }
}
