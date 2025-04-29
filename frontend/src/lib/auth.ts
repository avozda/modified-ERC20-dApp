import { createContext, useContext } from 'react';
import { AuthContextType } from './auth-types';

export { AuthProvider } from './auth-context';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}