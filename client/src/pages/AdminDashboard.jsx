import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FileText,
    Inbox,
    Search,
    CheckCircle2,
    UserPlus,
    Users,
    Calendar,
    CalendarDays,
    Eye,
    PenLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, usersAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import InviteModal from '../components/InviteModal';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, organization, isOwner } = useAuth();
    const location = useLocation();
    const activeTab = location.pathname.endsWith('/team') ? 'team' : 'reports';

    const [reports, setReports] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [stats, setStats] = useState({ total: 0, submitted: 0, under_review: 0, graded: 0 });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!window.confirm(`Deactivate ${userName}?`)) return;
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

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const roleBadge = (role) => ({
        owner: { label: 'Owner', class: 'role-owner' },
        admin: { label: 'Admin', class: 'role-admin' },
        intern: { label: 'Intern', class: 'role-intern' },
    }[role] || { label: 'Intern', class: 'role-intern' });

    const internCount = teamMembers.filter((m) => m.role === 'intern' && m.isActive).length;

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex justify-between items-center flex-wrap gap-md">
                    <div>
                        <h1 className="page-title">{activeTab === 'team' ? 'Team' : 'Dashboard'}</h1>
                        <p className="page-subtitle">
                            {activeTab === 'team'
                                ? 'Manage the people in your organization.'
                                : `Welcome back, ${user?.name}.`}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={16} />
                        Invite Member
                    </button>
                </div>

                {activeTab === 'reports' && (
                    <>
                        <div className="grid grid-4 mb-lg">
                            <StatCard icon={FileText} value={stats.total} label="Total Reports"
                                onClick={() => setFilter('all')} active={filter === 'all'} />
                            <StatCard icon={Inbox} value={stats.submitted} label="Pending Review"
                                onClick={() => setFilter('submitted')} active={filter === 'submitted'} />
                            <StatCard icon={Search} value={stats.under_review} label="Under Review"
                                onClick={() => setFilter('under_review')} active={filter === 'under_review'} />
                            <StatCard icon={CheckCircle2} value={stats.graded} label="Graded"
                                onClick={() => setFilter('graded')} active={filter === 'graded'} />
                        </div>

                        <div className="filter-bar">
                            <div className="filter-group">
                                <label>Status</label>
                                <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                                    <option value="all">All Reports</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="graded">Graded</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Sort by</label>
                                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="date">Date (Newest)</option>
                                    <option value="status">Status</option>
                                    <option value="intern">Intern Name</option>
                                </select>
                            </div>
                        </div>

                        <div className="reports-section">
                            {loading ? (
                                <div className="loading-container">
                                    <div className="spinner" />
                                    <p>Loading reports...</p>
                                </div>
                            ) : reports.length === 0 ? (
                                <EmptyState icon={Inbox} title="No reports yet"
                                    description="Reports from your interns will appear here.">
                                    <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                                        <UserPlus size={16} />
                                        Invite Interns
                                    </button>
                                </EmptyState>
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
                                                            {report.type === 'daily' ? <Calendar size={14} /> : <CalendarDays size={14} />}
                                                            {report.type === 'daily' ? 'Daily' : 'Weekly'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <p className="summary-preview">
                                                            {report.summary.length > 90
                                                                ? report.summary.substring(0, 90) + '...'
                                                                : report.summary}
                                                        </p>
                                                    </td>
                                                    <td className="date-cell">
                                                        {report.submittedAt ? formatDate(report.submittedAt) : '-'}
                                                    </td>
                                                    <td><StatusBadge status={report.status} /></td>
                                                    <td>
                                                        <Link to={`/admin/review/${report._id}`} className="btn btn-secondary btn-sm">
                                                            {report.status === 'graded' ? <Eye size={14} /> : <PenLine size={14} />}
                                                            {report.status === 'graded' ? 'View' : 'Review'}
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

                {activeTab === 'team' && (
                    <div className="team-section">
                        {organization && (
                            <div className="plan-info-card">
                                <div className="plan-header">
                                    <span className="plan-name">{(organization.plan || 'free').toUpperCase()} Plan</span>
                                </div>
                                <div className="plan-stats">
                                    <div className="plan-stat">
                                        <span className="plan-stat-value">
                                            {internCount} / {organization.limits?.maxInterns ?? 5}
                                        </span>
                                        <span className="plan-stat-label">Interns</span>
                                    </div>
                                    <div className="plan-stat">
                                        <span className="plan-stat-value">
                                            {Math.round(organization.usage?.storageUsedMB || 0)} / {organization.limits?.maxStorageMB ?? 100} MB
                                        </span>
                                        <span className="plan-stat-label">Storage</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner" />
                                <p>Loading team...</p>
                            </div>
                        ) : teamMembers.length === 0 ? (
                            <EmptyState icon={Users} title="No team members yet"
                                description="Invite interns and admins to get started.">
                                <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                                    <UserPlus size={16} />
                                    Send First Invite
                                </button>
                            </EmptyState>
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
                                                    {member._id === user?.id && <span className="you-badge">You</span>}
                                                </span>
                                                <span className="member-email">{member.email}</span>
                                            </div>
                                            <span className={`role-badge ${roleBadge(member.role).class}`}>
                                                {roleBadge(member.role).label}
                                            </span>
                                        </div>
                                        <div className="team-card-actions">
                                            {!member.isActive && <span className="status-inactive">Deactivated</span>}
                                            {isOwner() && member._id !== user?.id && member.role !== 'owner' && (
                                                member.isActive ? (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(member._id, member.name)}>
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(member._id, member.name)}>
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

            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onSuccess={() => { if (activeTab === 'team') fetchTeamData(); }}
            />
        </div>
    );
};

export default AdminDashboard;
