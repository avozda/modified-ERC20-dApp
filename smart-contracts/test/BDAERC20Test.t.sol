// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import "forge-std/Test.sol";
import "../src/BDAERC20.sol";

contract BDAERC20Test is Test {
    BDAERC20 token;

    address idpAdmin = address(0x1);
    address restrAdmin = address(0x2);
    address mintAdmin = address(0x3);
    address identityProvider = address(0x4);
    address user1 = address(0x5);
    address user2 = address(0x6);
    address nonVerifiedUser = address(0x7);

    uint256 maxSupply = 1_000_000 ether;
    uint256 maxDailyMint = 10_000 ether;
    uint256 expirationTime = 30 days;
    uint256 dailyLimit = 1_000 ether;

    address[] mintingAdmins;
    address[] restrAdmins;
    address[] idpAdmins;
    address[] identityProviders;

    event TokensMinted(address indexed to, uint256 amount);
    event TokensTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );

    function setUp() public {
        mintingAdmins = new address[](1);
        mintingAdmins[0] = mintAdmin;

        restrAdmins = new address[](1);
        restrAdmins[0] = restrAdmin;

        idpAdmins = new address[](1);
        idpAdmins[0] = idpAdmin;

        identityProviders = new address[](1);
        identityProviders[0] = identityProvider;

        token = new BDAERC20(
            maxSupply,
            maxDailyMint,
            expirationTime,
            mintingAdmins,
            restrAdmins,
            idpAdmins,
            identityProviders
        );

        // Verify users for testing
        vm.prank(idpAdmin);
        token.addVerifiedAddress(user1);

        vm.prank(idpAdmin);
        token.addVerifiedAddress(user2);

        // Set transfer limits for users
        vm.prank(restrAdmin);
        token.setDailyTransferLimit(user1, dailyLimit);

        vm.prank(restrAdmin);
        token.setDailyTransferLimit(user2, dailyLimit);
    }

    function testMint() public {
        uint256 mintAmount = 1000 ether;

        // Non-minting admin cannot mint
        vm.prank(user1);
        vm.expectRevert("Not a minting admin");
        token.mint(user1, mintAmount);

        // Minting admin can mint to verified address
        vm.prank(mintAdmin);
        vm.expectEmit(true, false, false, true);
        emit TokensMinted(user1, mintAmount);
        token.mint(user1, mintAmount);

        assertEq(token.totalSupply(), mintAmount);
        assertEq(token.balanceOf(user1), mintAmount);

        // Cannot mint to non-verified address
        vm.prank(mintAdmin);
        vm.expectRevert("Identity not verified");
        token.mint(nonVerifiedUser, mintAmount);

        // Cannot exceed daily mint limit
        vm.prank(mintAdmin);
        vm.expectRevert("Exceeds daily mint limit");
        token.mint(user1, maxDailyMint + 1);

        // Cannot exceed max supply
        vm.prank(mintAdmin);
        vm.expectRevert("Exceeds daily limit");
        token.mint(user1, maxSupply + 1);
    }

    function testTransfer() public {
        uint256 mintAmount = 1000 ether;
        uint256 transferAmount = 500 ether;

        // Mint some tokens first
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // User can transfer to another verified user
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit TokensTransferred(user1, user2, transferAmount);
        bool success = token.transfer(user2, transferAmount);

        assertTrue(success);
        assertEq(token.balanceOf(user1), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);

        // Cannot transfer to non-verified user
        vm.prank(user1);
        vm.expectRevert("Identity not verified");
        token.transfer(nonVerifiedUser, transferAmount);

        // Cannot exceed daily transfer limit
        vm.prank(user1);
        vm.expectRevert("Exceeds daily limit");
        token.transfer(user2, dailyLimit + 1);
    }

    function testTransferFrom() public {
        uint256 mintAmount = 1000 ether;
        uint256 transferAmount = 500 ether;
        uint256 allowanceAmount = 700 ether;

        // Mint some tokens first
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // User1 approves User2 to spend tokens
        vm.prank(user1);
        token.approve(user2, allowanceAmount);

        // User2 can transfer from User1 to themselves
        vm.prank(user2);
        vm.expectEmit(true, true, false, true);
        emit TokensTransferred(user1, user2, transferAmount);
        bool success = token.transferFrom(user1, user2, transferAmount);

        assertTrue(success);
        assertEq(token.balanceOf(user1), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);
        assertEq(
            token.allowance(user1, user2),
            allowanceAmount - transferAmount
        );

        // Cannot transfer to non-verified user
        vm.prank(user2);
        vm.expectRevert("Identity not verified");
        token.transferFrom(user1, nonVerifiedUser, transferAmount);

        // Cannot exceed daily transfer limit
        vm.prank(user2);
        vm.expectRevert("Exceeds daily limit");
        token.transferFrom(user1, user2, dailyLimit + 1);
    }

    function testCustomTransfer() public {
        uint256 mintAmount = 1000 ether;
        uint256 transferAmount = 500 ether;

        // Mint some tokens first
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // Any user can call the custom transfer function for another user
        vm.prank(user2);
        vm.expectEmit(true, true, false, true);
        emit TokensTransferred(user1, user2, transferAmount);
        token.transfer(user1, user2, transferAmount);

        assertEq(token.balanceOf(user1), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);

        // Cannot transfer to non-verified user
        vm.prank(user2);
        vm.expectRevert("Identity not verified");
        token.transfer(user1, nonVerifiedUser, transferAmount);

        // Cannot exceed daily transfer limit
        vm.prank(user2);
        vm.expectRevert("Exceeds daily limit");
        token.transfer(user1, user2, dailyLimit + 1);
    }

    function testDailyLimitRefresh() public {
        uint256 mintAmount = 1200 ether;
        uint256 smallTransfer = 300 ether;

        // Mint some tokens first
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // Do transfers up to limit
        vm.prank(user1);
        token.transfer(user2, smallTransfer);
        vm.prank(user1);
        token.transfer(user2, smallTransfer);
        vm.prank(user1);
        token.transfer(user2, smallTransfer);

        // Next transfer should fail because we've exceeded daily limit
        vm.prank(user1);
        vm.expectRevert("Exceeds daily limit");
        token.transfer(user2, smallTransfer);

        // But if we move to next day, limits should refresh
        vm.warp(block.timestamp + 1 days);

        // Now transfer should work again
        vm.prank(user1);
        bool success = token.transfer(user2, smallTransfer);
        assertTrue(success);
    }

    function testGetAddressInfo() public {
        uint256 mintAmount = 500 ether;
        uint256 transferAmount = 200 ether;

        // Mint tokens to user1
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // Transfer some tokens
        vm.prank(user1);
        token.transfer(user2, transferAmount);

        // Get address info for user1
        (
            uint256 dailyTransferred,
            uint256 dailyMinted,
            uint256 transferLimit,
            bool isVerified,
            bool isBlocked,
            bool isIdentityProvider,
            bool isMintingAdmin,
            bool isRestrictionAdmin,
            bool isIdpAdmin
        ) = token.getAddressInfo(user1);

        // Check returned values
        assertEq(dailyTransferred, transferAmount);
        assertEq(dailyMinted, 0); // User1 didn't mint
        assertEq(transferLimit, dailyLimit);
        assertTrue(isVerified);
        assertFalse(isBlocked);
        assertFalse(isIdentityProvider);
        assertFalse(isMintingAdmin);
        assertFalse(isRestrictionAdmin);
        assertFalse(isIdpAdmin);

        // Get address info for minting admin
        (
            dailyTransferred,
            dailyMinted,
            transferLimit,
            isVerified,
            isBlocked,
            isIdentityProvider,
            isMintingAdmin,
            isRestrictionAdmin,
            isIdpAdmin
        ) = token.getAddressInfo(mintAdmin);

        assertEq(dailyMinted, mintAmount); // Minting admin minted tokens
        assertTrue(isMintingAdmin);
    }

    function testBlockedUserCannotTransfer() public {
        uint256 mintAmount = 1000 ether;
        uint256 transferAmount = 500 ether;

        // Mint some tokens first
        vm.prank(mintAdmin);
        token.mint(user1, mintAmount);

        // Block user1
        vm.prank(restrAdmin);
        token.blockAddress(user1);

        // User1 cannot transfer when blocked
        vm.prank(user1);
        vm.expectRevert("Identity not verified");
        token.transfer(user2, transferAmount);

        // Unblock user1
        vm.prank(restrAdmin);
        token.unblockAddress(user1);

        // Now user1 can transfer
        vm.prank(user1);
        bool success = token.transfer(user2, transferAmount);
        assertTrue(success);
    }
}
