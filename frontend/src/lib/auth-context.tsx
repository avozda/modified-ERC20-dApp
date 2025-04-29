import { useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { AuthContext } from './auth';


export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for stored authentication data
        const storedAddress = localStorage.getItem('walletAddress');
        const authToken = localStorage.getItem('authToken');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        // Only restore if we have all components and token isn't expired
        if (storedAddress && authToken && tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry);
            if (expiryTime > Date.now()) {
                try {
                    // Verify the authToken format and content
                    const decodedToken = atob(authToken);
                    const [tokenAddress, , tokenExpiration] = decodedToken.split(':');

                    // Verify address matches the one in token
                    if (tokenAddress.toLowerCase() !== storedAddress.toLowerCase()) {
                        throw new Error('Token address mismatch');
                    }

                    // Verify expiration time matches
                    if (parseInt(tokenExpiration) !== expiryTime) {
                        throw new Error('Token expiration mismatch');
                    }

                    // If verification passes, restore the session
                    setWalletAddress(storedAddress);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error('Auth token verification failed:', err);
                    // Invalid token format or content
                    logout();
                }
            } else {
                // Clear expired auth data
                logout();
            }
        }
    }, []);

    const login = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }

            // Request account access
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (accounts && accounts.length > 0) {
                const address = accounts[0];

                // Generate a random challenge message with timestamp
                const nonce = Math.floor(Math.random() * 1000000).toString();
                const timestamp = Date.now().toString();
                const message = `Sign this message to prove you own this wallet: ${address}. Nonce: ${nonce}. Timestamp: ${timestamp}`;

                // Get the signer
                const signer = await provider.getSigner();

                // Request signature from user
                const signature = await signer.signMessage(message);

                // Verify the signature on client-side (basic check)
                const recoveredAddress = ethers.verifyMessage(message, signature);

                if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                    throw new Error('Signature verification failed');
                }

                const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
                const authToken = btoa(`${address}:${signature.slice(0, 10)}:${expiryTime}`);

                // Store in state and local storage
                setWalletAddress(address);
                localStorage.setItem('walletAddress', address);
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('tokenExpiry', expiryTime.toString());
                setIsAuthenticated(true);
            } else {
                throw new Error('No accounts found');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpiry');
        setWalletAddress(null);
        setIsAuthenticated(false);
    };

    const value = {
        isAuthenticated,
        walletAddress,
        login,
        logout,
        isLoading,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}