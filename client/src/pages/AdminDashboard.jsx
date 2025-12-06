import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, usersAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        submitted: 0,
        under_review: 0,
        graded: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    useEffect(() => {
        fetchData();
    }, [filter, sortBy]);

    const fetchData = async () => {
        try {
            const [reportsRes, statsRes] = await Promise.all([
                reportsAPI.getAll({ status: filter !== 'all' ? filter : undefined, sortBy }),
                reportsAPI.getStats(),
            ]);
            setReports(reportsRes.data.reports);
            setStats(statsRes.data.stats);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
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

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="container">
                    {/* Welcome Section */}
                    <div className="page-header">
                        <h1 className="page-title">Admin Dashboard 🎯</h1>
                        <p className="page-subtitle">Welcome back, {user?.name}! Here's an overview of all submissions.</p>
                    </div>

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
                        <h2 className="section-title">📋 All Submissions</h2>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading reports...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>No reports found</h3>
                                <p>No reports match your current filter.</p>
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
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
