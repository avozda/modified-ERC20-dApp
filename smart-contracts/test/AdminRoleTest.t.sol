// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import "forge-std/Test.sol";
import "../src/AdminRole.sol";

contract AdminRoleTest is Test {
    AdminRole adminRole;
    address admin1 = address(0x1);
    address admin2 = address(0x2);
    address admin3 = address(0x3);
    address nonAdmin = address(0x4);
    address newAdmin = address(0x5);
    address[] mintingAdmins;
    address[] restrAdmins;
    address[] idpAdmins;

    function setUp() public {
        mintingAdmins = new address[](2);
        mintingAdmins[0] = admin1;
        mintingAdmins[1] = admin2;

        restrAdmins = new address[](2);
        restrAdmins[0] = admin1;
        restrAdmins[1] = admin3;

        idpAdmins = new address[](2);
        idpAdmins[0] = admin2;
        idpAdmins[1] = admin3;

        adminRole = new AdminRole(mintingAdmins, restrAdmins, idpAdmins);
    }

    function testInitialAdminAssignment() public {
        // Test initial minting admins
        assertTrue(adminRole.mintingAdmins(admin1));
        assertTrue(adminRole.mintingAdmins(admin2));
        assertFalse(adminRole.mintingAdmins(admin3));
        assertFalse(adminRole.mintingAdmins(nonAdmin));

        // Test initial restriction admins
        assertTrue(adminRole.restrAdmins(admin1));
        assertFalse(adminRole.restrAdmins(admin2));
        assertTrue(adminRole.restrAdmins(admin3));
        assertFalse(adminRole.restrAdmins(nonAdmin));

        // Test initial idp admins
        assertFalse(adminRole.idpAdmins(admin1));
        assertTrue(adminRole.idpAdmins(admin2));
        assertTrue(adminRole.idpAdmins(admin3));
        assertFalse(adminRole.idpAdmins(nonAdmin));
    }

    function testMintingAdminVoting() public {
        // First vote
        vm.prank(admin1);
        adminRole.voteMintingAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRole.mintingAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin2);
        adminRole.voteMintingAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRole.mintingAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRole.mintingAdminCount(), 3);

        // Vote again to remove
        vm.prank(admin1);
        adminRole.voteMintingAdmin(newAdmin);
        vm.prank(admin2);
        adminRole.voteMintingAdmin(newAdmin);

        // Admin should be removed
        assertFalse(adminRole.mintingAdmins(newAdmin));
        assertEq(adminRole.mintingAdminCount(), 2);
    }

    function testRestrAdminVoting() public {
        // First vote
        vm.prank(admin1);
        adminRole.voteRestrAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRole.restrAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin3);
        adminRole.voteRestrAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRole.restrAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRole.restrAdminCount(), 3);
    }

    function testIdpAdminVoting() public {
        // First vote
        vm.prank(admin2);
        adminRole.voteIDPAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRole.idpAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin3);
        adminRole.voteIDPAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRole.idpAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRole.idpAdminCount(), 3);
    }

    function testNonAdminCannotVote() public {
        // Non-admin tries to vote
        vm.prank(nonAdmin);
        vm.expectRevert("Not a minting admin");
        adminRole.voteMintingAdmin(newAdmin);

        vm.prank(nonAdmin);
        vm.expectRevert("Not a restriction admin");
        adminRole.voteRestrAdmin(newAdmin);

        vm.prank(nonAdmin);
        vm.expectRevert("Not an identity provider admin");
        adminRole.voteIDPAdmin(newAdmin);
    }

    function testDuplicateVotes() public {
        // First vote
        vm.prank(admin1);
        adminRole.voteMintingAdmin(newAdmin);

        // Same admin votes again
        vm.prank(admin1);
        vm.expectRevert("Already voted");
        adminRole.voteMintingAdmin(newAdmin);
    }
}
