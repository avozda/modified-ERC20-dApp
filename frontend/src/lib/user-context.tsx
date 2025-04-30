import React, { createContext, useContext, useState, ReactNode } from 'react';


interface UserContext {
    dailyTransferred: number;
    dailyMinted: number;
    transferLimit: number;
    isVerified: boolean;
    isBlocked: boolean;
    isIdentityProvider: boolean;
    isMintingAdmin: boolean;
    isRestrictionAdmin: boolean;
    isIdpAdmin: boolean;
}

interface UserContextData {
    dailyTransferred: number;
    dailyMinted: number;
    transferLimit: number;
    isVerified: boolean;
    isBlocked: boolean;
    isIdentityProvider: boolean;
    isMintingAdmin: boolean;
    isRestrictionAdmin: boolean;
    isIdpAdmin: boolean;
    setUserData: React.Dispatch<React.SetStateAction<UserContext>>;
}

const initialContextValue: UserContext = {
    dailyTransferred: 0,
    dailyMinted: 0,
    transferLimit: 0,
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