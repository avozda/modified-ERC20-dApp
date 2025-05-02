// SPDX-License-Identifier: APGL-3.0
pragma solidity 0.8.29;

import {Script} from "forge-std/Script.sol";
import {BDAERC20} from "../src/BDAERC20.sol";

/**
 * @title DeployBDAERC20
 * @dev Script to deploy BDA25 token contract with configuration parameters
 */
contract DeployBDAERC20 is Script {
    // Deployment configuration
    uint256 public constant MAX_SUPPLY = 1_000_000 ether; // 1 million tokens with 18 decimals
    uint256 public constant MAX_DAILY_MINT = 10_000 ether; // 10,000 tokens per day per minting admin
    uint256 public constant VERIFICATION_EXPIRY = 365 days; // Verification valid for 1 year

    function run() external {
        // Setup admin addresses - these should be replaced with actual addresses in production
        address[] memory mintingAdmins = new address[](1);
        address[] memory restrAdmins = new address[](1);
        address[] memory idpAdmins = new address[](1);
        address[] memory identityProviders = new address[](1);

        // Initialize admin arrays
        mintingAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        restrAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        idpAdmins[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        identityProviders[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

        // Deploy the contract
        vm.startBroadcast();

        new BDAERC20(
            MAX_SUPPLY,
            MAX_DAILY_MINT,
            VERIFICATION_EXPIRY,
            mintingAdmins,
            restrAdmins,
            idpAdmins,
            identityProviders
        );

        vm.stopBroadcast();
    }
}
