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
        onlyVerified(to)
        checkLimitRefresh
        meetsLimit(totalSupply() + amount, maxSupply)
    {
        require(
            dailyMintedAmount[msg.sender] + amount <= maxDailyMint,
            "Exceeds daily mint limit"
        );

        if (!isBalanceHolder(to)) {
            addBalanceHolder(to);
        }
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
        checkLimitRefresh
        meetsLimit(
            dailyTransferredAmount[from] + amount,
            dailyTransferLimit[from]
        )
        onlyVerified(to)
    {
        if (!isBalanceHolder(to)) {
            addBalanceHolder(to);
        }
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
    )
        public
        override
        checkLimitRefresh
        meetsLimit(
            dailyTransferredAmount[msg.sender] + amount,
            dailyTransferLimit[msg.sender]
        )
        onlyVerified(to)
        returns (bool)
    {
        if (!isBalanceHolder(to)) {
            addBalanceHolder(to);
        }
        bool success = super.transfer(to, amount);
        if (success) {
            emit TokensTransferred(msg.sender, to, amount);
            dailyTransferredAmount[msg.sender] += amount;
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
    )
        public
        override
        checkLimitRefresh
        meetsLimit(
            dailyTransferredAmount[from] + amount,
            dailyTransferLimit[from]
        )
        onlyVerified(to)
        returns (bool)
    {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            emit TokensTransferred(from, to, amount);
            dailyTransferredAmount[from] += amount;
        }
        return success;
    }

    function getAddressInfo(
        address user
    )
        external
        view
        returns (
            uint256 dailyTransferred,
            uint256 dailyMinted,
            uint256 transferLimit,
            bool isVerified,
            bool isBlocked,
            bool isIdentityProvider,
            bool isMintingAdmin,
            bool isRestrictionAdmin,
            bool isIdpAdmin
        )
    {
        dailyTransferred = dailyTransferredAmount[user];
        dailyMinted = dailyMintedAmount[user];
        transferLimit = dailyTransferLimit[user];
        isVerified =
            verifiedAddresses[user] != 0 &&
            verifiedAddresses[user] + expirationTime > block.timestamp;
        isBlocked = blockedAddresses[user];
        isIdentityProvider = trustedIdentityProviders[user];
        isMintingAdmin = mintingAdmins[user];
        isRestrictionAdmin = restrAdmins[user];
        isIdpAdmin = idpAdmins[user];
    }
}
