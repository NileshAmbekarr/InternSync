import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import PasswordInput from '../components/PasswordInput';
import toast from 'react-hot-toast';
import './Auth.css';

const AcceptInvite = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('form'); // form, error
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Clear error when typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
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

            toast.success('Welcome to the team! 🎉', {
                duration: 5000
            });

            // Redirect based on role
            const role = response.data.user.role;
            navigate(role === 'intern' ? '/dashboard' : '/admin');
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid or expired invitation';
            toast.error(message, { duration: 6000 });
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'error') {
        return (
            <div className="auth-page">
                <div className="auth-container" style={{ textAlign: 'center' }}>
                    <div className="auth-logo">
                        <span className="logo-icon">⚡</span>
                        <h1 className="logo-text">InternSync</h1>
                    </div>
                    <div style={{ padding: 'var(--spacing-xl) 0' }}>
                        <div className="status-icon error">❌</div>
                        <h2>Invalid Invitation</h2>
                        <p className="status-message">
                            This invitation link is invalid or has expired. Please ask your administrator to send a new invitation.
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
                    <p className="auth-subtitle">Complete your account setup to join your team.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Create Password</label>
                        <PasswordInput
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            minLength={6}
                            className={errors.password ? 'error' : ''}
                        />
                        {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <PasswordInput
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && (
                            <span className="form-error">{errors.confirmPassword}</span>
                        )}
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
