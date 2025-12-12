import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

const AcceptInvite = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, form, error
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Just show the form - token will be validated on submit
        if (token) {
            setStatus('form');
        } else {
            setStatus('error');
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.acceptInvite(token, {
                name: formData.name,
                password: formData.password
            });

            // Store token and redirect
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success('Welcome to the team!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid or expired invitation');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="auth-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="auth-page">
                <div className="auth-container" style={{ textAlign: 'center' }}>
                    <div className="auth-logo">
                        <span className="logo-icon">⚡</span>
                        <h1 className="logo-text">InternSync</h1>
                    </div>
                    <div style={{ padding: 'var(--spacing-xl) 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>❌</div>
                        <h2>Invalid Invitation</h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            This invitation link is invalid or has expired.
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="logo-icon">⚡</span>
                        <h1 className="logo-text">InternSync</h1>
                    </div>
                    <p className="auth-subtitle">Complete your account setup</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Create Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 20, height: 20 }}></span>
                                Setting up...
                            </>
                        ) : (
                            'Join Team'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AcceptInvite;
