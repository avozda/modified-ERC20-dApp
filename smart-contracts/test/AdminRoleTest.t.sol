// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import "forge-std/Test.sol";
import "../src/AdminRoles.sol";

contract AdminRolesTest is Test {
    AdminRoles adminRoles;
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

        adminRoles = new AdminRoles(mintingAdmins, restrAdmins, idpAdmins);
    }

    function testMintingAdminVoting() public {
        // First vote
        vm.prank(admin1);
        adminRoles.voteMintingAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRoles.mintingAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin2);
        adminRoles.voteMintingAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRoles.mintingAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRoles.mintingAdminCount(), 3);

        // Vote again to remove
        vm.prank(admin1);
        adminRoles.voteMintingAdmin(newAdmin);
        vm.prank(admin2);
        adminRoles.voteMintingAdmin(newAdmin);

        // Admin should be removed
        assertFalse(adminRoles.mintingAdmins(newAdmin));
        assertEq(adminRoles.mintingAdminCount(), 2);
    }

    function testRestrAdminVoting() public {
        // First vote
        vm.prank(admin1);
        adminRoles.voteRestrAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRoles.restrAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin3);
        adminRoles.voteRestrAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRoles.restrAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRoles.restrAdminCount(), 3);
    }

    function testIdpAdminVoting() public {
        // First vote
        vm.prank(admin2);
        adminRoles.voteIDPAdmin(newAdmin);

        // Check that newAdmin is not yet an admin (needs majority)
        assertFalse(adminRoles.idpAdmins(newAdmin));

        // Second vote (this should push it over majority)
        vm.prank(admin3);
        adminRoles.voteIDPAdmin(newAdmin);

        // Now newAdmin should be an admin
        assertTrue(adminRoles.idpAdmins(newAdmin));

        // Counter should be updated
        assertEq(adminRoles.idpAdminCount(), 3);
    }

    function testNonAdminCannotVote() public {
        // Non-admin tries to vote
        vm.prank(nonAdmin);
        vm.expectRevert("Not a minting admin");
        adminRoles.voteMintingAdmin(newAdmin);

        vm.prank(nonAdmin);
        vm.expectRevert("Not a restriction admin");
        adminRoles.voteRestrAdmin(newAdmin);

        vm.prank(nonAdmin);
        vm.expectRevert("Not an identity provider admin");
        adminRoles.voteIDPAdmin(newAdmin);
    }

    function testDuplicateVotes() public {
        // First vote
        vm.prank(admin1);
        adminRoles.voteMintingAdmin(newAdmin);

        // Same admin votes again
        vm.prank(admin1);
        vm.expectRevert("Already voted");
        adminRoles.voteMintingAdmin(newAdmin);
    }
}
