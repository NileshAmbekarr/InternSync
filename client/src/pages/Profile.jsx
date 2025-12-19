import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
    const { user, organization } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        department: user?.department || ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await usersAPI.updateProfile(formData);
            toast.success('Profile updated successfully!');
            setEditing(false);
            // Refresh page to get updated user data
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleBadge = (role) => {
        const badges = {
            owner: { label: 'Owner', class: 'role-owner' },
            admin: { label: 'Admin', class: 'role-admin' },
            intern: { label: 'Intern', class: 'role-intern' }
        };
        return badges[role] || badges.intern;
    };

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="container container-sm">
                    <div className="page-header">
                        <h1 className="page-title">Profile</h1>
                        <p className="page-subtitle">Manage your account information</p>
                    </div>

                    {/* Profile Card */}
                    <div className="profile-card">
                        <div className="profile-header">
                            <div className="profile-avatar-lg">
                                {getInitials(user?.name)}
                            </div>
                            <div className="profile-header-info">
                                <h2>{user?.name}</h2>
                                <span className={`role-badge ${getRoleBadge(user?.role).class}`}>
                                    {getRoleBadge(user?.role).label}
                                </span>
                            </div>
                        </div>

                        <div className="profile-section">
                            <h3>Account Information</h3>

                            {editing ? (
                                <form onSubmit={handleSubmit} className="profile-form">
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            className="form-input"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="e.g., Engineering, Marketing"
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => setEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="profile-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Email</span>
                                        <span className="detail-value">{user?.email}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Name</span>
                                        <span className="detail-value">{user?.name}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Department</span>
                                        <span className="detail-value">{user?.department || 'Not set'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Role</span>
                                        <span className="detail-value">{user?.role}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Email Verified</span>
                                        <span className="detail-value">
                                            {user?.isEmailVerified ? (
                                                <span className="verified">✓ Verified</span>
                                            ) : (
                                                <span className="not-verified">Not verified</span>
                                            )}
                                        </span>
                                    </div>

                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="profile-section">
                            <h3>Organization</h3>
                            <div className="org-info-card">
                                <div className="org-name">{organization?.name}</div>
                                <span className="plan-badge">{organization?.plan?.toUpperCase() || 'FREE'} Plan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
