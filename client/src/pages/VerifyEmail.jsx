import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await authAPI.verifyEmail(token);
                setStatus('success');
                toast.success('Email verified successfully!');
                setTimeout(() => navigate('/dashboard'), 3000);
            } catch (error) {
                setStatus('error');
                toast.error(error.response?.data?.message || 'Verification failed');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="auth-page">
            <div className="auth-container" style={{ textAlign: 'center' }}>
                <div className="auth-logo">
                    <span className="logo-icon">⚡</span>
                    <h1 className="logo-text">InternSync</h1>
                </div>

                {status === 'verifying' && (
                    <div className="loading-container" style={{ minHeight: 150 }}>
                        <div className="spinner"></div>
                        <p>Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ padding: 'var(--spacing-xl) 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>✅</div>
                        <h2>Email Verified!</h2>
                        <p>Your email has been verified successfully. Redirecting to dashboard...</p>
                        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                            Go to Dashboard
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ padding: 'var(--spacing-xl) 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>❌</div>
                        <h2>Verification Failed</h2>
                        <p>The verification link is invalid or has expired.</p>
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
