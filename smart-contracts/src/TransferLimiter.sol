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
    mapping(address => uint256) public lastTransferResetTimestamp;

    // Daily minting limit variables
    uint256 public immutable maxDailyMint;
    mapping(address => uint256) public dailyMintedAmount;
    mapping(address => uint256) public lastDailyMintResetTimestamp;

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
     * @param lastResetTimestamps Mapping of last reset timestamps
     * @param dailyAmount Mapping of daily amounts
     */
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

    /**
     * @dev Updates the daily transferred amount for an address
     * @param user Address to update
     * @param amount Amount to add to daily transferred
     */
    function updateDailyTransferred(address user, uint256 amount) internal {
        if (lastTransferResetTimestamp[user] + 1 days <= block.timestamp) {
            dailyTransferredAmount[user] = amount;
            lastTransferResetTimestamp[user] = block.timestamp;
        } else {
            dailyTransferredAmount[user] += amount;
        }
    }

    /**
     * @dev Updates the daily minted amount for an address
     * @param user Address to update
     * @param amount Amount to add to daily minted
     */
    function updateDailyMinted(address user, uint256 amount) internal {
        if (lastDailyMintResetTimestamp[user] + 1 days <= block.timestamp) {
            dailyMintedAmount[user] = amount;
            lastDailyMintResetTimestamp[user] = block.timestamp;
        } else {
            dailyMintedAmount[user] += amount;
        }
    }
}
