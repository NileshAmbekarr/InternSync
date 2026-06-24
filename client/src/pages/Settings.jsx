import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, CreditCard, BarChart3, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
    const { user, organization } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('general');

    useEffect(() => {
        if (user && !['admin', 'owner'].includes(user.role)) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const sections = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'plan', label: 'Plan & Billing', icon: CreditCard },
        { id: 'usage', label: 'Usage', icon: BarChart3 },
    ];

    const limits = organization?.limits || {};
    const usage = organization?.usage || {};
    const pct = (used, max) => Math.min(100, max ? (used / max) * 100 : 0);

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">Organization Settings</h1>
                    <p className="page-subtitle">Manage {organization?.name}</p>
                </div>

                <div className="settings-layout">
                    <aside className="settings-sidebar">
                        <nav className="settings-nav">
                            {sections.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
                                    onClick={() => setActiveSection(id)}
                                >
                                    <Icon size={17} />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <main className="settings-content">
                        {activeSection === 'general' && (
                            <div className="settings-section">
                                <h2>General</h2>
                                <p className="section-desc">Manage your organization details.</p>

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
                                            <p>Allow team members to sign in with Google.</p>
                                        </div>
                                        <span className={`status-pill ${organization?.settings?.allowGoogleAuth ? 'enabled' : 'disabled'}`}>
                                            {organization?.settings?.allowGoogleAuth ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'plan' && (
                            <div className="settings-section">
                                <h2>Plan & Billing</h2>
                                <p className="section-desc">Manage your subscription.</p>

                                <div className="plan-card current">
                                    <div className="plan-card-header">
                                        <span className="plan-name">{(organization?.plan || 'free').toUpperCase()}</span>
                                        <span className="current-plan-badge">Current Plan</span>
                                    </div>
                                    <div className="plan-features">
                                        <div className="plan-feature"><Check size={15} />Up to {limits.maxInterns ?? 5} interns</div>
                                        <div className="plan-feature"><Check size={15} />{limits.maxStorageMB ?? 100}MB storage</div>
                                        <div className="plan-feature"><Check size={15} />Up to {limits.maxAdmins ?? 2} admins</div>
                                    </div>
                                </div>

                                <div className="upgrade-section">
                                    <h3>Need more?</h3>
                                    <p>Upgrade to Pro for up to 50 interns, 1GB storage, and more.</p>
                                    <button className="btn btn-primary" disabled>Upgrade to Pro (Coming Soon)</button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'usage' && (
                            <div className="settings-section">
                                <h2>Usage</h2>
                                <p className="section-desc">Track your organization's resource usage.</p>

                                <div className="usage-cards">
                                    <div className="usage-card">
                                        <div className="usage-header">
                                            <span className="usage-label">Interns</span>
                                            <span className="usage-value">{usage.currentInterns || 0} / {limits.maxInterns ?? 5}</span>
                                        </div>
                                        <div className="meter">
                                            <div className="meter-fill" style={{ width: `${pct(usage.currentInterns || 0, limits.maxInterns ?? 5)}%` }} />
                                        </div>
                                    </div>

                                    <div className="usage-card">
                                        <div className="usage-header">
                                            <span className="usage-label">Admins</span>
                                            <span className="usage-value">{usage.currentAdmins || 0} / {limits.maxAdmins ?? 2}</span>
                                        </div>
                                        <div className="meter">
                                            <div className="meter-fill" style={{ width: `${pct(usage.currentAdmins || 0, limits.maxAdmins ?? 2)}%` }} />
                                        </div>
                                    </div>

                                    <div className="usage-card">
                                        <div className="usage-header">
                                            <span className="usage-label">Storage</span>
                                            <span className="usage-value">{(usage.storageUsedMB || 0).toFixed(1)}MB / {limits.maxStorageMB ?? 100}MB</span>
                                        </div>
                                        <div className="meter">
                                            <div className="meter-fill" style={{ width: `${pct(usage.storageUsedMB || 0, limits.maxStorageMB ?? 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Settings;
