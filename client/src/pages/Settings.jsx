import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const { user, organization, isOwner } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('general');

    // Redirect non-admins
    useEffect(() => {
        if (user && !['admin', 'owner'].includes(user.role)) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="container">
                    <div className="page-header">
                        <h1 className="page-title">Organization Settings</h1>
                        <p className="page-subtitle">Manage {organization?.name}</p>
                    </div>

                    <div className="settings-layout">
                        {/* Sidebar */}
                        <aside className="settings-sidebar">
                            <nav className="settings-nav">
                                <button
                                    className={`settings-nav-item ${activeSection === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('general')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                    General
                                </button>
                                <button
                                    className={`settings-nav-item ${activeSection === 'plan' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('plan')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                        <line x1="1" y1="10" x2="23" y2="10"></line>
                                    </svg>
                                    Plan & Billing
                                </button>
                                <button
                                    className={`settings-nav-item ${activeSection === 'usage' ? 'active' : ''}`}
                                    onClick={() => setActiveSection('usage')}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20V10"></path>
                                        <path d="M18 20V4"></path>
                                        <path d="M6 20v-4"></path>
                                    </svg>
                                    Usage
                                </button>
                            </nav>
                        </aside>

                        {/* Content */}
                        <main className="settings-content">
                            {/* General Settings */}
                            {activeSection === 'general' && (
                                <div className="settings-section">
                                    <h2>General Settings</h2>
                                    <p className="section-desc">Manage your organization details</p>

                                    <div className="settings-card">
                                        <div className="setting-row">
                                            <div className="setting-info">
                                                <label>Organization Name</label>
                                                <p>{organization?.name}</p>
                                            </div>
                                            <span className="coming-soon">Coming soon</span>
                                        </div>

                                        <div className="setting-row">
                                            <div className="setting-info">
                                                <label>Organization Slug</label>
                                                <p>{organization?.slug}</p>
                                            </div>
                                        </div>

                                        <div className="setting-row">
                                            <div className="setting-info">
                                                <label>Google OAuth</label>
                                                <p>Allow team members to sign in with Google</p>
                                            </div>
                                            <span className={`status-badge ${organization?.settings?.allowGoogleAuth ? 'enabled' : 'disabled'}`}>
                                                {organization?.settings?.allowGoogleAuth ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plan & Billing */}
                            {activeSection === 'plan' && (
                                <div className="settings-section">
                                    <h2>Plan & Billing</h2>
                                    <p className="section-desc">Manage your subscription</p>

                                    <div className="plan-card current">
                                        <div className="plan-card-header">
                                            <span className="plan-name">{organization?.plan?.toUpperCase() || 'FREE'}</span>
                                            <span className="current-plan-badge">Current Plan</span>
                                        </div>
                                        <div className="plan-features">
                                            <div className="plan-feature">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                Up to {organization?.limits?.maxInterns || 5} interns
                                            </div>
                                            <div className="plan-feature">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                {organization?.limits?.maxStorageMB || 100}MB storage
                                            </div>
                                            <div className="plan-feature">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                Up to {organization?.limits?.maxAdmins || 2} admins
                                            </div>
                                        </div>
                                    </div>

                                    <div className="upgrade-section">
                                        <h3>Need more?</h3>
                                        <p>Upgrade to Pro for up to 50 interns, 1GB storage, and more.</p>
                                        <button className="btn btn-primary" disabled>
                                            Upgrade to Pro (Coming Soon)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Usage */}
                            {activeSection === 'usage' && (
                                <div className="settings-section">
                                    <h2>Usage</h2>
                                    <p className="section-desc">Track your organization's resource usage</p>

                                    <div className="usage-cards">
                                        <div className="usage-card">
                                            <div className="usage-header">
                                                <span className="usage-label">Interns</span>
                                                <span className="usage-value">
                                                    {organization?.usage?.currentInterns || 0} / {organization?.limits?.maxInterns || 5}
                                                </span>
                                            </div>
                                            <div className="usage-bar">
                                                <div
                                                    className="usage-bar-fill"
                                                    style={{
                                                        width: `${((organization?.usage?.currentInterns || 0) / (organization?.limits?.maxInterns || 5)) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="usage-card">
                                            <div className="usage-header">
                                                <span className="usage-label">Admins</span>
                                                <span className="usage-value">
                                                    {organization?.usage?.currentAdmins || 0} / {organization?.limits?.maxAdmins || 2}
                                                </span>
                                            </div>
                                            <div className="usage-bar">
                                                <div
                                                    className="usage-bar-fill"
                                                    style={{
                                                        width: `${((organization?.usage?.currentAdmins || 0) / (organization?.limits?.maxAdmins || 2)) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="usage-card">
                                            <div className="usage-header">
                                                <span className="usage-label">Storage</span>
                                                <span className="usage-value">
                                                    {(organization?.usage?.storageUsedMB || 0).toFixed(1)}MB / {organization?.limits?.maxStorageMB || 100}MB
                                                </span>
                                            </div>
                                            <div className="usage-bar">
                                                <div
                                                    className="usage-bar-fill storage"
                                                    style={{
                                                        width: `${((organization?.usage?.storageUsedMB || 0) / (organization?.limits?.maxStorageMB || 100)) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;
