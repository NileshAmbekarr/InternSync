import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Owner has all admin permissions
    const userRole = user?.role;
    const hasAccess = allowedRoles.includes(userRole) ||
        (userRole === 'owner' && allowedRoles.includes('admin'));

    if (!hasAccess) {
        // Redirect to appropriate dashboard
        const redirectPath = userRole === 'intern' ? '/dashboard' : '/admin';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;
