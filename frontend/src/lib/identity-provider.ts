import { ethers } from 'ethers';

// Mock IDP wallet keys - in a real application, these would be managed by a separate service
const MOCK_IDP_KEY = {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // This should match one of the trusted IDPs in your contract
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // Example private key - NEVER use this in production
};

interface VerificationData {
    userAddress: string;
    timestamp: number;
    idpAddress: string;
    message: string;
    signature: string;
}

/**
 * Mock identity provider service for verifying user addresses in the frontend
 */
export const mockIdentityProvider = {
    /**
     * Generate a verification signature for a user address
     * @param userAddress The Ethereum address to verify
     * @returns Verification data including signature
     */
    verifyAddress: async (userAddress: string): Promise<VerificationData> => {
        try {
            // Create a wallet instance using the mock identity provider private key
            const idpWallet = new ethers.Wallet(MOCK_IDP_KEY.privateKey);

            // Get current timestamp in seconds
            const timestamp = Math.floor(Date.now() / 1000);

            // Create the message string exactly as it's constructed in the smart contract for hashing
            const messageString = `User with address ${userAddress} has verified their identity at ${timestamp}`;

            const messageHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "address", "string", "uint256"],
                    [
                        "User with address ",
                        userAddress,
                        " has verified their identity at ",
                        timestamp,
                    ]
                )
            );

            // Correct way to sign (to match smart contract)
            const signature = await idpWallet.signMessage(ethers.getBytes(messageHash));


            console.log("Identity verification prepared:");
            console.log(`User Address: ${userAddress}`);
            console.log(`Timestamp: ${timestamp}`);
            console.log(`IDP Address: ${idpWallet.address}`);
            console.log(`Message Hash: ${messageHash}`);
            console.log(`Signature: ${signature}`);

            return {
                userAddress,
                timestamp,
                idpAddress: idpWallet.address,
                message: messageString,
                signature
            };
        } catch (error) {
            console.error("Error verifying identity:", error);
            throw new Error("Identity verification failed");
        }
    }
};