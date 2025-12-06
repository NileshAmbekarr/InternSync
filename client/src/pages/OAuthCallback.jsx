import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Use the token to authenticate
            loginWithToken(token)
                .then((user) => {
                    toast.success(`Welcome, ${user.name}!`);
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard');
                })
                .catch((error) => {
                    toast.error('Authentication failed. Please try again.');
                    navigate('/login');
                });
        } else {
            toast.error('Authentication failed. No token received.');
            navigate('/login');
        }
    }, [searchParams, loginWithToken, navigate]);

    return (
        <div className="auth-page">
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Completing sign in...</p>
            </div>
        </div>
    );
};

export default OAuthCallback;
