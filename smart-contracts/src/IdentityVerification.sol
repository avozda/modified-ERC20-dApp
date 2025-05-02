//SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./AdminRole.sol";

/**
 * @title IdentityVerification
 * @dev Contract to manage user identity verification
 */
contract IdentityVerification is AdminRole {
    using ECDSA for bytes32;

    // Identity verification related variables
    mapping(address => bool) public trustedIdentityProviders;
    mapping(address => uint256) public verifiedAddresses; // Maps address to verification timestamp
    mapping(address => bool) public blockedAddresses; // Maps address to blocked status
    uint256 public immutable expirationTime;

    // Events
    event IdentityVerified(address indexed user, uint256 timestamp);
    event IdentityProviderAdded(address indexed provider);
    event IdentityProviderRemoved(address indexed provider);
    event AddressBlocked(address indexed user);
    event AddressUnblocked(address indexed user);

    constructor(
        uint256 _expirationTime,
        address[] memory _identityProviders,
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins
    ) AdminRole(_mintingAdmins, _restrAdmins, _idpAdmins) {
        expirationTime = _expirationTime;

        // Initialize trusted identity providers
        for (uint256 i = 0; i < _identityProviders.length; i++) {
            trustedIdentityProviders[_identityProviders[i]] = true;
            emit IdentityProviderAdded(_identityProviders[i]);
        }
    }

    /**
     * @dev Checks if an address has been verified
     * @param user Address to check
     * @return bool True if the address is verified, false otherwise
     */
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

    /**
     * @dev Modifier that checks if an address is verified
     */
    modifier onlyVerified(address user) {
        require(isVerified(user), "Identity not verified");
        _;
    }

    /**
     * @dev Allows a user to verify their identity using a signature from a trusted provider
     * @param timestamp Time when the verification happened
     * @param signature The signature from the trusted identity provider
     */
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
        emit IdentityVerified(msg.sender, timestamp);
    }

    /**
     * @dev Adds a new identity provider
     * @param provider Address of the provider to add
     */
    function addIdentityProvider(address provider) external onlyIDPAdmin {
        trustedIdentityProviders[provider] = true;
        emit IdentityProviderAdded(provider);
    }

    /**
     * @dev Removes an identity provider
     * @param provider Address of the provider to remove
     */
    function removeIdentityProvider(address provider) external onlyIDPAdmin {
        trustedIdentityProviders[provider] = false;
        emit IdentityProviderRemoved(provider);
    }

    /**
     * @dev Blocks an address from being considered verified
     * @param user Address to block
     */
    function blockAddress(address user) external onlyRestrAdmin {
        blockedAddresses[user] = true;
        emit AddressBlocked(user);
    }

    /**
     * @dev Unblocks a previously blocked address
     * @param user Address to unblock
     */
    function unblockAddress(address user) external onlyRestrAdmin {
        blockedAddresses[user] = false;
        emit AddressUnblocked(user);
    }

    /**
     * @dev Manually adds a verified address (admin function)
     * @param user Address to verify
     */
    function addVerifiedAddress(address user) external onlyIDPAdmin {
        // Use current timestamp for verification, not timestamp + expirationTime
        verifiedAddresses[user] = block.timestamp;
        emit IdentityVerified(user, block.timestamp);
    }

    /**
     * @dev Removes verification status from an address
     * @param user Address to unverify
     */
    function removeVerifiedAddress(address user) external onlyIDPAdmin {
        verifiedAddresses[user] = 0;
    }
}
