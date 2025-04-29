//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TransferLimiter.sol";

/**
 * @title BDAERC20
 * @dev Main ERC20 token contract with enhanced functionality
 */
contract BDAERC20 is ERC20, TransferLimiter {
    uint256 public immutable maxSupply;

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    /**
     * @dev Contract constructor
     * @param _maxSupply Maximum token supply
     * @param _maxDailyMint Maximum amount that can be minted per day by each minting admin
     * @param _expirationTime Time after which a verification expires
     * @param _mintingAdmins Initial list of minting admins
     * @param _restrAdmins Initial list of restriction admins
     * @param _idpAdmins Initial list of identity provider admins
     * @param _identityProviders Initial list of trusted identity providers
     */
    constructor(
        uint256 _maxSupply,
        uint256 _maxDailyMint,
        uint256 _expirationTime,
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins,
        address[] memory _identityProviders
    )
        ERC20("BDA25 Token", "BDA25")
        TransferLimiter(
            _maxDailyMint,
            _expirationTime,
            _identityProviders,
            _mintingAdmins,
            _restrAdmins,
            _idpAdmins
        )
    {
        maxSupply = _maxSupply;
    }

    /**
     * @dev Mints tokens to a specific address (restricted to minting admins)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(
        address to,
        uint256 amount
    )
        external
        onlyMintingAdmin
        checkLimitRefresh(lastDailyMintResetTimestamp, dailyMintedAmount)
        meetsLimit(totalSupply() + amount, maxSupply)
    {
        require(
            dailyMintedAmount[msg.sender] + amount <= maxDailyMint,
            "Exceeds daily mint limit"
        );
        _mint(to, amount);
        updateDailyMinted(msg.sender, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Custom transfer function with limits and verification checks
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount of tokens to transfer
     */
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
        updateDailyTransferred(from, amount);
        emit TokensTransferred(from, to, amount);
    }

    /**
     * @dev Overrides the standard ERC20 transfer to enforce verification checks
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return success Whether the transfer was successful
     */
    function transfer(
        address to,
        uint256 amount
    ) public override onlyVerified(to) returns (bool) {
        if (dailyTransferLimit[msg.sender] != 0) {
            if (
                lastTransferResetTimestamp[msg.sender] + 1 days <=
                block.timestamp
            ) {
                dailyTransferredAmount[msg.sender] = 0;
                lastTransferResetTimestamp[msg.sender] = block.timestamp;
            }

            require(
                dailyTransferredAmount[msg.sender] + amount <=
                    dailyTransferLimit[msg.sender],
                "Exceeds daily limit"
            );

            dailyTransferredAmount[msg.sender] += amount;
        }

        bool success = super.transfer(to, amount);
        if (success) {
            emit TokensTransferred(msg.sender, to, amount);
        }
        return success;
    }

    /**
     * @dev Overrides the standard ERC20 transferFrom to enforce verification checks
     * @param from Address to transfer tokens from
     * @param to Address to transfer tokens to
     * @param amount Amount of tokens to transfer
     * @return success Whether the transfer was successful
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override onlyVerified(to) returns (bool) {
        if (dailyTransferLimit[from] != 0) {
            if (lastTransferResetTimestamp[from] + 1 days <= block.timestamp) {
                dailyTransferredAmount[from] = 0;
                lastTransferResetTimestamp[from] = block.timestamp;
            }

            require(
                dailyTransferredAmount[from] + amount <=
                    dailyTransferLimit[from],
                "Exceeds daily limit"
            );

            dailyTransferredAmount[from] += amount;
        }

        bool success = super.transferFrom(from, to, amount);
        if (success) {
            emit TokensTransferred(from, to, amount);
        }
        return success;
    }
}
