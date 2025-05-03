// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import "forge-std/Script.sol";

import {BDAERC20} from "../src/BDAERC20.sol";

/**
 * @title DeployBDAERC20
 * @dev Script to deploy BDA25 token contract with configuration parameters
 */
contract DeployBDAERC20 is Script {
    // Deployment configuration
    uint256 public constant MAX_SUPPLY = 1_000_000 ether;
    uint256 public constant MAX_DAILY_MINT = 10_000 ether;
    uint256 public constant VERIFICATION_EXPIRY = 10 days;

    function run() external {
        address[] memory mintingAdmins = new address[](1);
        address[] memory restrAdmins = new address[](1);
        address[] memory idpAdmins = new address[](1);
        address[] memory identityProviders = new address[](1);

        //Secret key for this address: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        mintingAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        restrAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        idpAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        identityProviders[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

        vm.startBroadcast();

        BDAERC20 BDAContract = new BDAERC20(
            MAX_SUPPLY,
            MAX_DAILY_MINT,
            VERIFICATION_EXPIRY,
            mintingAdmins,
            restrAdmins,
            idpAdmins,
            identityProviders
        );

        console2.log(address(BDAContract));
        vm.stopBroadcast();
    }
}
