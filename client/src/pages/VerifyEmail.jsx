import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layers, CheckCircle2, XCircle } from 'lucide-react';
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
                toast.success('Email verified successfully');
                setTimeout(() => navigate('/dashboard'), 3000);
            } catch (error) {
                setStatus('error');
                toast.error(error.response?.data?.message || 'Verification failed');
            }
        };
        if (token) verifyEmail();
    }, [token, navigate]);

    return (
        <div className="auth-page">
            <div className="auth-container auth-centered">
                <div className="auth-logo">
                    <span className="logo-icon"><Layers size={22} /></span>
                    <h1 className="logo-text">InternSync</h1>
                </div>

                {status === 'verifying' && (
                    <div className="loading-container" style={{ minHeight: 150 }}>
                        <div className="spinner" />
                        <p>Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="auth-status">
                        <div className="status-icon success"><CheckCircle2 size={32} /></div>
                        <h2>Email Verified</h2>
                        <p className="status-message">Your email has been verified. Redirecting to your dashboard...</p>
                        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="auth-status">
                        <div className="status-icon error"><XCircle size={32} /></div>
                        <h2>Verification Failed</h2>
                        <p className="status-message">The verification link is invalid or has expired.</p>
                        <Link to="/login" className="btn btn-primary">Go to Login</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
