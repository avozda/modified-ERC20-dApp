import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/overlay/PageLoader";

export function Login() {
    const { login, isAuthenticated, isLoading, error } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    if (isLoading) {
        return <div className="h-screen"> <PageLoader message="Connecting wallet..." /></div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-svh gap-6">
            <h1 className="text-3xl font-bold">Connect your wallet</h1>
            {error && (
                <div className="p-4 text-white bg-red-500 rounded-md">
                    {error}
                </div>
            )}
            <Button
                onClick={login}
                disabled={isLoading}
                className="flex items-center gap-2"
            >
                Connect with MetaMask
            </Button>
        </div>
    );
}