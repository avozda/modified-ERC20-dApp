export type AuthContextType = {
    isAuthenticated: boolean;
    walletAddress: string | null;
    login: () => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
};