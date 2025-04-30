import { Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useUserContext } from './user-context';

type ProtectedRouteProps = {
    children: React.ReactNode;
    requiredRole?: 'mintingAdmin' | 'restrictionAdmin' | 'notBlocked' | 'idpAdmin';
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const userData = useUserContext();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-svh">
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // Role-based access control
    if (requiredRole) {
        // Check permissions based on required role
        if (requiredRole === 'mintingAdmin' && !userData.isMintingAdmin) {
            return <Navigate to="/dashboard" replace />;
        }
        if (requiredRole === 'restrictionAdmin' && !userData.isRestrictionAdmin) {
            return <Navigate to="/dashboard" replace />;
        }
        if (requiredRole === 'idpAdmin' && !userData.isIdpAdmin) {
            return <Navigate to="/dashboard" replace />;
        }
        if (requiredRole === 'notBlocked' && (userData.isBlocked || !userData.isVerified)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}