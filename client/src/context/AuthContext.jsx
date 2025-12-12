import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const response = await authAPI.getMe();
                setUser(response.data.user);
                setOrganization(response.data.organization);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('organization');
                setUser(null);
                setOrganization(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user, organization } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('organization', JSON.stringify(organization));
        setUser(user);
        setOrganization(organization);

        return { user, organization };
    };

    // Login with token (for OAuth callback)
    const loginWithToken = async (token) => {
        localStorage.setItem('token', token);

        const response = await authAPI.getMe();
        const { user, organization } = response.data;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('organization', JSON.stringify(organization));
        setUser(user);
        setOrganization(organization);

        return user;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { token, user, organization } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('organization', JSON.stringify(organization));
        setUser(user);
        setOrganization(organization);

        return { user, organization };
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('organization');
        setUser(null);
        setOrganization(null);
    };

    const isOwner = () => user?.role === 'owner';
    const isAdmin = () => ['admin', 'owner'].includes(user?.role);
    const isIntern = () => user?.role === 'intern';
    const isEmailVerified = () => user?.isEmailVerified === true;

    const value = {
        user,
        organization,
        loading,
        login,
        loginWithToken,
        register,
        logout,
        isOwner,
        isAdmin,
        isIntern,
        isEmailVerified,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
