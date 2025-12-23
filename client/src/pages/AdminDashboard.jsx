import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, usersAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import InviteModal from '../components/InviteModal';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, organization, isOwner } = useAuth();
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        submitted: 0,
        under_review: 0,
        graded: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        if (activeTab === 'reports') {
            fetchReportsData();
        } else {
            fetchTeamData();
        }
    }, [activeTab, filter, sortBy]);

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const [reportsRes, statsRes] = await Promise.all([
                reportsAPI.getAll({ status: filter !== 'all' ? filter : undefined, sortBy }),
                reportsAPI.getStats(),
            ]);
            setReports(reportsRes.data.reports);
            setStats(statsRes.data.stats);
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            const res = await usersAPI.getTeam();
            setTeamMembers(res.data.users);
        } catch (error) {
            toast.error('Failed to fetch team');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to deactivate ${userName}?`)) return;

        try {
            await usersAPI.deactivate(userId);
            toast.success(`${userName} has been deactivated`);
            fetchTeamData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to deactivate');
        }
    };

    const handleReactivate = async (userId, userName) => {
        try {
            await usersAPI.reactivate(userId);
            toast.success(`${userName} has been reactivated`);
            fetchTeamData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reactivate');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
                <div className="container">
                    {/* Header */}
                    <div className="page-header">
                        <div className="header-content">
                            <div>
                                <h1 className="page-title">Dashboard 🎯</h1>
                                <p className="page-subtitle">
                                    Welcome back, {user?.name}!
                                    <span className="org-badge">{organization?.name}</span>
                                </p>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowInviteModal(true)}
                            >
                                + Invite Team Member
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="dashboard-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            📋 Reports
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
                            onClick={() => setActiveTab('team')}
                        >
                            👥 Team ({teamMembers.length || '...'})
                        </button>
                    </div>

                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-4 mb-lg">
                                <div className="stat-card stat-total">
                                    <div className="stat-icon">📊</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.total}</span>
                                        <span className="stat-label">Total Reports</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-pending" onClick={() => setFilter('submitted')}>
                                    <div className="stat-icon">📥</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.submitted}</span>
                                        <span className="stat-label">Pending Review</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-review" onClick={() => setFilter('under_review')}>
                                    <div className="stat-icon">🔍</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.under_review}</span>
                                        <span className="stat-label">Under Review</span>
                                    </div>
                                </div>
                                <div className="stat-card stat-graded" onClick={() => setFilter('graded')}>
                                    <div className="stat-icon">✅</div>
                                    <div className="stat-info">
                                        <span className="stat-value">{stats.graded}</span>
                                        <span className="stat-label">Graded</span>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="filter-bar">
                                <div className="filter-group">
                                    <label>Filter by Status:</label>
                                    <select
                                        className="form-select"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="all">All Reports</option>
                                        <option value="submitted">Submitted</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="graded">Graded</option>
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label>Sort by:</label>
                                    <select
                                        className="form-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="date">Date (Newest)</option>
                                        <option value="status">Status</option>
                                        <option value="intern">Intern Name</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reports Table */}
                            <div className="reports-section">
                                {loading ? (
                                    <div className="loading-container">
                                        <div className="spinner"></div>
                                        <p>Loading reports...</p>
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📭</div>
                                        <h3>No reports yet</h3>
                                        <p>Reports from your interns will appear here.</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setShowInviteModal(true)}
                                        >
                                            Invite Interns
                                        </button>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Intern</th>
                                                    <th>Type</th>
                                                    <th>Summary</th>
                                                    <th>Submitted</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reports.map((report) => (
                                                    <tr key={report._id}>
                                                        <td>
                                                            <div className="intern-info">
                                                                <span className="intern-name">{report.intern?.name}</span>
                                                                <span className="intern-email">{report.intern?.email}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`report-type type-${report.type}`}>
                                                                {report.type === 'daily' ? '📅 Daily' : '📆 Weekly'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <p className="summary-preview">
                                                                {report.summary.length > 100
                                                                    ? report.summary.substring(0, 100) + '...'
                                                                    : report.summary
                                                                }
                                                            </p>
                                                        </td>
                                                        <td className="date-cell">
                                                            {report.submittedAt ? formatDate(report.submittedAt) : '-'}
                                                        </td>
                                                        <td>
                                                            <StatusBadge status={report.status} />
                                                        </td>
                                                        <td>
                                                            <Link
                                                                to={`/admin/review/${report._id}`}
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                {report.status === 'graded' ? '👁️ View' : '✏️ Review'}
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && (
                        <div className="team-section">
                            {/* Plan Info */}
                            {organization && (
                                <div className="plan-info-card">
                                    <div className="plan-header">
                                        <span className="plan-name">{organization.plan?.toUpperCase() || 'FREE'} Plan</span>
                                    </div>
                                    <div className="plan-stats">
                                        <div className="plan-stat">
                                            <span className="plan-stat-value">
                                                {teamMembers.filter(m => m.role === 'intern' && m.isActive).length} / {organization.limits?.maxInterns || 5}
                                            </span>
                                            <span className="plan-stat-label">Interns</span>
                                        </div>
                                        <div className="plan-stat">
                                            <span className="plan-stat-value">
                                                {Math.round(organization.usage?.storageUsedMB || 0)} / {organization.limits?.maxStorageMB || 100} MB
                                            </span>
                                            <span className="plan-stat-label">Storage</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading team...</p>
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👤</div>
                                    <h3>No team members yet</h3>
                                    <p>Invite interns and admins to get started.</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowInviteModal(true)}
                                    >
                                        Send First Invite
                                    </button>
                                </div>
                            ) : (
                                <div className="team-list">
                                    {teamMembers.map((member) => (
                                        <div key={member._id} className={`team-card ${!member.isActive ? 'inactive' : ''}`}>
                                            <div className="team-card-main">
                                                <div className="member-avatar">
                                                    {member.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-name">
                                                        {member.name}
                                                        {member._id === user?.id && <span className="you-badge">(You)</span>}
                                                    </span>
                                                    <span className="member-email">{member.email}</span>
                                                </div>
                                                <span className={`role-badge ${getRoleBadge(member.role).class}`}>
                                                    {getRoleBadge(member.role).label}
                                                </span>
                                            </div>
                                            <div className="team-card-actions">
                                                {!member.isActive && (
                                                    <span className="status-inactive">Deactivated</span>
                                                )}
                                                {isOwner() && member._id !== user?.id && member.role !== 'owner' && (
                                                    member.isActive ? (
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => handleDeactivate(member._id, member.name)}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => handleReactivate(member._id, member.name)}
                                                        >
                                                            Reactivate
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={() => {
                    if (activeTab === 'team') fetchTeamData();
                }}
            />
        </>
    );
};

export default AdminDashboard;
