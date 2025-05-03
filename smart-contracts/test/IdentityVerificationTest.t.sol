// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import "forge-std/Test.sol";
import "../src/IdentityVerification.sol";

contract IdentityVerificationTest is Test {
    IdentityVerification idVerification;

    address idpAdmin1 = address(0x1);
    address idpAdmin2 = address(0x2);
    address restrAdmin1 = address(0x3);
    address restrAdmin2 = address(0x4);
    address mintAdmin = address(0x5);
    address identityProvider = address(0x6);
    address user = address(0x7);
    address nonUser = address(0x8);

    uint256 idpAdminKey = 0xA;
    uint256 expirationTime = 30 days;

    address[] mintingAdmins;
    address[] restrAdmins;
    address[] idpAdmins;
    address[] identityProviders;

    function setUp() public {
        mintingAdmins = new address[](1);
        mintingAdmins[0] = mintAdmin;

        restrAdmins = new address[](2);
        restrAdmins[0] = restrAdmin1;
        restrAdmins[1] = restrAdmin2;

        idpAdmins = new address[](2);
        idpAdmins[0] = idpAdmin1;
        idpAdmins[1] = idpAdmin2;

        identityProviders = new address[](1);
        identityProviders[0] = identityProvider;

        idVerification = new IdentityVerification(
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );
    }

    function testAddIdentityProvider() public {
        address newIDP = address(0x9);

        // Non-IDP admin cannot add providers
        vm.prank(nonUser);
        vm.expectRevert("Not an identity provider admin");
        idVerification.addIdentityProvider(newIDP);

        // IDP admin can add providers
        vm.prank(idpAdmin1);
        idVerification.addIdentityProvider(newIDP);

        assertTrue(idVerification.trustedIdentityProviders(newIDP));
    }

    function testRemoveIdentityProvider() public {
        // Non-IDP admin cannot remove providers
        vm.prank(nonUser);
        vm.expectRevert("Not an identity provider admin");
        idVerification.removeIdentityProvider(identityProvider);

        // IDP admin can remove providers
        vm.prank(idpAdmin1);
        idVerification.removeIdentityProvider(identityProvider);

        assertFalse(idVerification.trustedIdentityProviders(identityProvider));
    }

    function testAddVerifiedAddress() public {
        // Only IDP admin can manually add verified address
        vm.prank(nonUser);
        vm.expectRevert("Not an identity provider admin");
        idVerification.addVerifiedAddress(user);

        // IDP admin adds verified address
        vm.prank(idpAdmin1);
        idVerification.addVerifiedAddress(user);

        // Check timestamp is set and user is verified
        assertGt(idVerification.verifiedAddresses(user), 0);
        assertTrue(idVerification.isVerified(user));
    }

    function testRemoveVerifiedAddress() public {
        // Add verified address first
        vm.prank(idpAdmin1);
        idVerification.addVerifiedAddress(user);

        // Verify user is verified
        assertTrue(idVerification.isVerified(user));

        // Remove verification
        vm.prank(idpAdmin1);
        idVerification.removeVerifiedAddress(user);

        // Check user is no longer verified
        assertFalse(idVerification.isVerified(user));
        assertEq(idVerification.verifiedAddresses(user), 0);
    }

    function testBlockAddress() public {
        // Add verified address first
        vm.prank(idpAdmin1);
        idVerification.addVerifiedAddress(user);

        // Verify user is verified
        assertTrue(idVerification.isVerified(user));

        // Non-restriction admin cannot block
        vm.prank(nonUser);
        vm.expectRevert("Not an identity provider admin");
        idVerification.blockAddress(user);

        // Restriction admin can block
        vm.prank(idpAdmin1);
        idVerification.blockAddress(user);

        assertTrue(idVerification.blockedAddresses(user));
        // User is not considered verified when blocked
        assertFalse(idVerification.isVerified(user));
    }

    function testUnblockAddress() public {
        // Add verified address first
        vm.prank(idpAdmin1);
        idVerification.addVerifiedAddress(user);

        // Block the user
        vm.prank(idpAdmin1);
        idVerification.blockAddress(user);

        assertFalse(idVerification.isVerified(user));

        // Non-restriction admin cannot unblock
        vm.prank(nonUser);
        vm.expectRevert("Not an identity provider admin");
        idVerification.unblockAddress(user);

        // Restriction admin can unblock
        vm.prank(idpAdmin1);
        idVerification.unblockAddress(user);

        assertFalse(idVerification.blockedAddresses(user));
        // User should be verified again after unblocking
        assertTrue(idVerification.isVerified(user));
    }

    function testVerificationExpiration() public {
        // Add verified address
        vm.prank(idpAdmin1);
        idVerification.addVerifiedAddress(user);

        // User should be verified
        assertTrue(idVerification.isVerified(user));

        // Move time forward beyond expiration
        vm.warp(block.timestamp + expirationTime + 1);

        // User should no longer be verified
        assertFalse(idVerification.isVerified(user));
    }

    function testVerifyIdentity() public {
        uint256 timestamp = block.timestamp;

        // Create message hash that identity provider would sign
        bytes32 messageHash = keccak256(
            abi.encodePacked("Verified ", user, "at ", timestamp)
        );

        // Convert hash to Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // Generate private key for identity provider
        uint256 privateKey = 0xBEEF;
        address recoveredSigner = vm.addr(privateKey);

        // Make sure the recovered signer is our identity provider for this test
        vm.prank(idpAdmin1);
        idVerification.addIdentityProvider(recoveredSigner);

        // Sign the message with identity provider's key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            privateKey,
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        // User verifies their identity with the signature
        vm.prank(user);
        idVerification.verifyIdentity(timestamp, signature);

        // Check user is now verified
        assertTrue(idVerification.isVerified(user));
        assertEq(idVerification.verifiedAddresses(user), timestamp);
    }

    function testInvalidSignature() public {
        uint256 timestamp = block.timestamp;

        // Generate invalid signature
        bytes memory invalidSignature = "invalid signature";

        // User tries to verify with invalid signature
        vm.prank(user);
        vm.expectRevert();
        idVerification.verifyIdentity(timestamp, invalidSignature);

        // User should not be verified
        assertFalse(idVerification.isVerified(user));
    }
}
