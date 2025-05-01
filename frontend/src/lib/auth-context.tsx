import { useEffect, useState, ReactNode, useCallback } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { AuthContext } from './auth';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { address, isConnected } = useAccount();
    const { connectAsync, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const logout = useCallback(() => {
        localStorage.removeItem('tokenExpiry');
        setIsAuthenticated(false);
        disconnect();
    }, [disconnect]);

    // Check token validity
    useEffect(() => {
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        if (tokenExpiry && isConnected && address) {
            const expiryTime = parseInt(tokenExpiry);
            if (expiryTime > Date.now()) {
                setIsAuthenticated(true);
            } else {
                logout();
            }
        }
    }, [address, isConnected, logout]);

    useEffect(() => {
        if (!isConnected) {
            logout();
        }
    }, [isConnected, logout]);

    const login = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let currentAddress = address;

            if (!isConnected) {
                const connector = connectors[0];
                if (!connector) {
                    throw new Error('No wallet connectors available');
                }

                const result = await connectAsync({ connector });
                currentAddress = result?.accounts?.[0];

                if (!currentAddress) {
                    throw new Error('Failed to connect wallet');
                }
            }
            const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour

            localStorage.setItem('tokenExpiry', expiryTime.toString());
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        isAuthenticated,
        walletAddress: address || null,
        login,
        logout,
        isLoading,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}