// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import "forge-std/Test.sol";
import "../src/TransferLimitation.sol";

contract TransferLimitationTest is Test {
    TransferLimitation transferLimitation;

    address idpAdmin = address(0x1);
    address restrAdmin = address(0x2);
    address mintAdmin = address(0x3);
    address identityProvider = address(0x4);
    address user = address(0x5);
    address recipient = address(0x6);
    address nonVerifiedUser = address(0x7);

    uint256 maxDailyMint = 1000 ether;
    uint256 expirationTime = 30 days;
    uint256 dailyLimit = 100 ether;

    address[] mintingAdmins;
    address[] restrAdmins;
    address[] idpAdmins;
    address[] identityProviders;

    function setUp() public {
        mintingAdmins = new address[](1);
        mintingAdmins[0] = mintAdmin;

        restrAdmins = new address[](1);
        restrAdmins[0] = restrAdmin;

        idpAdmins = new address[](1);
        idpAdmins[0] = idpAdmin;

        identityProviders = new address[](1);
        identityProviders[0] = identityProvider;

        transferLimitation = new TransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Set up verified users
        vm.prank(idpAdmin);
        transferLimitation.addVerifiedAddress(user);

        vm.prank(idpAdmin);
        transferLimitation.addVerifiedAddress(recipient);

        // Set daily limit for user
        vm.prank(restrAdmin);
        transferLimitation.setDailyTransferLimit(user, dailyLimit);
    }

    function testSetDailyTransferLimit() public {
        // Non-restriction admin cannot set limits
        vm.prank(user);
        vm.expectRevert("Not a restriction admin");
        transferLimitation.setDailyTransferLimit(user, 200 ether);

        // Restriction admin can set limits
        vm.prank(restrAdmin);
        transferLimitation.setDailyTransferLimit(user, 200 ether);

        assertEq(transferLimitation.dailyTransferLimit(user), 200 ether);
    }

    function testAddBalanceHolder() public {
        // We need to create a helper function to expose the internal addBalanceHolder
        // using a mock contract
        MockTransferLimitation mockLimitation = new MockTransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Non-verified user cannot be added as balance holder
        vm.expectRevert("User is not verified");
        mockLimitation.publicAddBalanceHolder(nonVerifiedUser);

        // Verified user can be added as balance holder
        vm.prank(idpAdmin);
        mockLimitation.addVerifiedAddress(nonVerifiedUser);
        mockLimitation.publicAddBalanceHolder(nonVerifiedUser);

        // Check the user is now a balance holder
        assertTrue(mockLimitation.publicIsBalanceHolder(nonVerifiedUser));
    }

    function testDailyLimitRefresh() public {
        MockTransferLimitation mockLimitation = new MockTransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Set up user as a balance holder
        vm.prank(idpAdmin);
        mockLimitation.addVerifiedAddress(user);
        mockLimitation.publicAddBalanceHolder(user);

        // Set daily transferred amount for user
        mockLimitation.setDailyTransferred(user, 50 ether);
        assertEq(mockLimitation.dailyTransferredAmount(user), 50 ether);

        // Warp time to next day
        vm.warp(block.timestamp + 1 days);

        // Calling a function with checkLimitRefresh should reset limits
        mockLimitation.callCheckLimitRefresh();

        // Check that daily transferred is reset
        assertEq(mockLimitation.dailyTransferredAmount(user), 0);
    }

    function testMeetsLimitModifier() public {
        MockTransferLimitation mockLimitation = new MockTransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Set daily limit for user
        vm.prank(restrAdmin);
        mockLimitation.setDailyTransferLimit(user, 100 ether);

        // This should pass as amount is below limit
        mockLimitation.testMeetsLimitPass(50 ether, 100 ether);

        // This should revert as amount is above limit
        vm.expectRevert("Exceeds daily limit");
        mockLimitation.testMeetsLimitPass(150 ether, 100 ether);

        // This should pass if limit is 0 (unlimited)
        mockLimitation.testMeetsLimitPass(1000 ether, 0);
    }

    function testUpdateDailyTransferred() public {
        MockTransferLimitation mockLimitation = new MockTransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Update daily transferred for user
        mockLimitation.publicUpdateDailyTransferred(user, 50 ether);
        assertEq(mockLimitation.dailyTransferredAmount(user), 50 ether);

        // Add more to daily transferred
        mockLimitation.publicUpdateDailyTransferred(user, 25 ether);
        assertEq(mockLimitation.dailyTransferredAmount(user), 75 ether);
    }

    function testUpdateDailyMinted() public {
        MockTransferLimitation mockLimitation = new MockTransferLimitation(
            maxDailyMint,
            expirationTime,
            identityProviders,
            mintingAdmins,
            restrAdmins,
            idpAdmins
        );

        // Update daily minted for admin
        mockLimitation.publicUpdateDailyMinted(mintAdmin, 100 ether);
        assertEq(mockLimitation.dailyMintedAmount(mintAdmin), 100 ether);

        // Add more to daily minted
        mockLimitation.publicUpdateDailyMinted(mintAdmin, 50 ether);
        assertEq(mockLimitation.dailyMintedAmount(mintAdmin), 150 ether);
    }
}

// Mock contract to expose internal functions for testing
contract MockTransferLimitation is TransferLimitation {
    constructor(
        uint256 _maxDailyMint,
        uint256 _expirationTime,
        address[] memory _identityProviders,
        address[] memory _mintingAdmins,
        address[] memory _restrAdmins,
        address[] memory _idpAdmins
    )
        TransferLimitation(
            _maxDailyMint,
            _expirationTime,
            _identityProviders,
            _mintingAdmins,
            _restrAdmins,
            _idpAdmins
        )
    {}

    function publicAddBalanceHolder(address user) external {
        addBalanceHolder(user);
    }

    function publicIsBalanceHolder(address user) external view returns (bool) {
        return isBalanceHolder(user);
    }

    function publicUpdateDailyTransferred(
        address from,
        uint256 amount
    ) external {
        updateDailyTransferred(from, amount);
    }

    function publicUpdateDailyMinted(address user, uint256 amount) external {
        updateDailyMinted(user, amount);
    }

    function setDailyTransferred(address user, uint256 amount) external {
        dailyTransferredAmount[user] = amount;
    }

    // Function just to call the modifier
    function callCheckLimitRefresh() external checkLimitRefresh {}

    // Function just to test the meetsLimit modifier
    function testMeetsLimitPass(
        uint256 amount,
        uint256 limit
    ) external meetsLimit(amount, limit) {}
}
