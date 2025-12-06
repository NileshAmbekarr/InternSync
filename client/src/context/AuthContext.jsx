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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                const response = await authAPI.getMe();
                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        return user;
    };

    // Login with token (for OAuth callback)
    const loginWithToken = async (token) => {
        localStorage.setItem('token', token);

        // Fetch user info with the new token
        const response = await authAPI.getMe();
        const user = response.data.user;

        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        return user;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        const { token, user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => user?.role === 'admin';
    const isIntern = () => user?.role === 'intern';
    const isEmailVerified = () => user?.isEmailVerified === true;

    const value = {
        user,
        loading,
        login,
        loginWithToken,
        register,
        logout,
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
