#!/usr/bin/env node
/**
 * Identity Provider Simulator for BDAERC20 Token
 *
 * This script simulates a centralized identity provider (IDP) that verifies
 * user identities and signs verification messages that can be used with the
 * BDAERC20 smart contract.
 */

const fs = require("fs");
const path = require("path");
const ethers = require("ethers");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Configuration
const IDP_KEY_FILE = "idp_key.json";

/**
 * Generate and save a new identity provider key pair
 */
function generateIdpKeys() {
  // Create a new random wallet
  const wallet = ethers.Wallet.createRandom();

  const keyData = {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };

  fs.writeFileSync(IDP_KEY_FILE, JSON.stringify(keyData, null, 2));

  console.log(`Generated new IDP keys:`);
  console.log(`Address: ${wallet.address}`);
  console.log(`Private key saved to ${IDP_KEY_FILE}`);

  return wallet;
}

/**
 * Load existing IDP keys from file
 */
function loadIdpKeys() {
  try {
    const keyData = JSON.parse(fs.readFileSync(IDP_KEY_FILE, "utf8"));
    const wallet = new ethers.Wallet(keyData.privateKey);
    console.log(`Loaded IDP keys for address: ${wallet.address}`);
    return wallet;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`No existing keys found. Generating new IDP keys...`);
      return generateIdpKeys();
    }
    throw error;
  }
}

/**
 * Sign an identity verification message for a user
 *
 * @param {string} userAddress - The Ethereum address of the user to verify
 * @param {number} timestamp - Optional timestamp to use (defaults to current time)
 * @returns {object} Contains signature, timestamp, and verification information
 */
function signIdentityMessage(userAddress, timestamp = null) {
  if (!timestamp) {
    timestamp = Math.floor(Date.now() / 1000);
  }

  // Create the message in the format expected by the smart contract
  const message = `User with address ${userAddress} has verified their identity at ${timestamp}`;
  console.log(`\nCreating verification message: \n${message}`);

  // Get the IDP account
  const idpWallet = loadIdpKeys();

  // Sign the message
  const signature = idpWallet.signMessage(message);

  const verificationData = {
    user_address: userAddress,
    timestamp: timestamp,
    idp_address: idpWallet.address,
    message: message,
    signature: signature,
  };

  console.log("\nVerification successful!");
  console.log(`User Address:  ${userAddress}`);
  console.log(`Timestamp:     ${timestamp}`);
  console.log(`IDP Address:   ${idpWallet.address}`);
  console.log(`Signature:     ${signature}`);
  console.log(
    "\nTo verify your identity on-chain, call the verifyIdentity function with:"
  );
  console.log(`  timestamp: ${timestamp}`);
  console.log(`  signature: ${signature}`);

  return verificationData;
}

// Command line interface
async function main() {
  const argv = yargs(hideBin(process.argv))
    .command("generate-keys", "Generate new IDP keys")
    .command("verify <address>", "Verify a user's identity", (yargs) => {
      return yargs
        .positional("address", {
          describe: "Ethereum address of the user to verify",
          type: "string",
        })
        .option("timestamp", {
          describe: "Optional timestamp to use (defaults to current time)",
          type: "number",
        });
    })
    .demandCommand(1, "You need to specify a command")
    .help().argv;

  if (argv._[0] === "generate-keys") {
    generateIdpKeys();
  } else if (argv._[0] === "verify") {
    signIdentityMessage(argv.address, argv.timestamp);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}

module.exports = {
  generateIdpKeys,
  loadIdpKeys,
  signIdentityMessage,
};
