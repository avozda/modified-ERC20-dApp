import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWatchContractEvent } from 'wagmi';
import ContractOptions from './contract';
import { useAuth } from './auth';

interface UserContext {
    dailyTransferred: bigint;
    dailyMinted: bigint;
    transferLimit: bigint;
    isVerified: boolean;
    isBlocked: boolean;
    isIdentityProvider: boolean;
    isMintingAdmin: boolean;
    isRestrictionAdmin: boolean;
    isIdpAdmin: boolean;
}

interface UserContextData {
    dailyTransferred: bigint;
    dailyMinted: bigint;
    transferLimit: bigint;
    isVerified: boolean;
    isBlocked: boolean;
    isIdentityProvider: boolean;
    isMintingAdmin: boolean;
    isRestrictionAdmin: boolean;
    isIdpAdmin: boolean;
    setUserData: React.Dispatch<React.SetStateAction<UserContext>>;
}

const initialContextValue: UserContext = {
    dailyTransferred: 0n,
    dailyMinted: 0n,
    transferLimit: 0n,
    isVerified: false,
    isBlocked: false,
    isIdentityProvider: false,
    isMintingAdmin: false,
    isRestrictionAdmin: false,
    isIdpAdmin: false,
};

const UserContext = createContext<UserContext>(initialContextValue);

export const useUserContext = () => useContext(UserContext);

interface UserProviderProps {
    children: ReactNode;
    data: UserContext | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, data = initialContextValue }) => {
    const [userData, setUserData] = useState<UserContext>(data ?? initialContextValue);
    const { walletAddress } = useAuth();

    // Setup event watchers to update user data when relevant blockchain events occur
    useEffect(() => {
        if (!walletAddress) return;
    }, [walletAddress]);

    // Listen for TransferLimitSet events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'TransferLimitSet',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                if (log.args.user && log.args.user.toLowerCase() === walletAddress?.toLowerCase()) {
                    // Update the transfer limit directly in the context
                    setUserData(prevData => ({
                        ...prevData,
                        transferLimit: log.args.limit
                    }));
                }
            });
        },
    });

    // Listen for IdentityVerified events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'IdentityVerified',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                if (log.args.user && log.args.user.toLowerCase() === walletAddress?.toLowerCase()) {
                    setUserData(prevData => ({
                        ...prevData,
                        isVerified: true
                    }));
                }
            });
        },
    });

    // Listen for AddressBlocked events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'AddressBlocked',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                if (log.args.user && log.args.user.toLowerCase() === walletAddress?.toLowerCase()) {
                    setUserData(prevData => ({
                        ...prevData,
                        isBlocked: true
                    }));
                }
            });
        },
    });

    // Listen for AddressUnblocked events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'AddressUnblocked',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                if (log.args.user && log.args.user.toLowerCase() === walletAddress?.toLowerCase()) {
                    setUserData(prevData => ({
                        ...prevData,
                        isBlocked: false
                    }));
                }
            });
        },
    });

    // Listen for AdminStatusChanged events
    useWatchContractEvent({
        ...ContractOptions,
        eventName: 'AdminStatusChanged',
        onLogs(logs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logs.forEach((log: any) => {
                if (log.args && log.args.admin && log.args.admin.toLowerCase() === walletAddress?.toLowerCase()) {
                    // Update admin status based on the adminType
                    const adminType = log.args.adminType;
                    const isAdmin = log.args.isAdmin;

                    setUserData(prevData => {
                        const newData = { ...prevData };

                        // Update the appropriate admin status based on adminType
                        if (adminType === 0) { // Assuming 0 for minting admin
                            newData.isMintingAdmin = isAdmin;
                        } else if (adminType === 1) { // Assuming 1 for restriction admin
                            newData.isRestrictionAdmin = isAdmin;
                        } else if (adminType === 2) { // Assuming 2 for IDP admin
                            newData.isIdpAdmin = isAdmin;
                        }

                        return newData;
                    });
                }
            });
        },
    });

    const contextValue: UserContextData = {
        ...userData,
        setUserData,
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};