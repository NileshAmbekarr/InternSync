import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import FileDropzone from '../components/FileDropzone';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import './InternDashboard.css';

const InternDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'daily',
        summary: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await reportsAPI.getMyReports();
            setReports(response.data.reports);
        } catch (error) {
            toast.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.summary.trim()) {
            toast.error('Please enter a summary');
            return;
        }

        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('type', formData.type);
            data.append('summary', formData.summary);
            data.append('submitNow', 'true');

            if (selectedFile) {
                data.append('file', selectedFile);
            }

            await reportsAPI.create(data);
            toast.success('Report submitted successfully!');

            // Reset form
            setFormData({ type: 'daily', summary: '' });
            setSelectedFile(null);
            setShowForm(false);

            // Refresh reports
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUndo = async (reportId) => {
        try {
            await reportsAPI.undo(reportId);
            toast.success('Report returned to draft');
            fetchReports();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to undo submission');
        }
    };

    const getStats = () => {
        const stats = {
            total: reports.length,
            draft: reports.filter(r => r.status === 'draft').length,
            submitted: reports.filter(r => r.status === 'submitted').length,
            graded: reports.filter(r => r.status === 'graded').length,
        };
        return stats;
    };

    const stats = getStats();

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
                        <h1 className="page-title">Welcome back, {user?.name}! 👋</h1>
                        <p className="page-subtitle">Track your progress and submit your reports.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-4 mb-lg">
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.total}</span>
                                <span className="stat-label">Total Reports</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.draft}</span>
                                <span className="stat-label">Drafts</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📤</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.submitted}</span>
                                <span className="stat-label">Submitted</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <span className="stat-value">{stats.graded}</span>
                                <span className="stat-label">Graded</span>
                            </div>
                        </div>
                    </div>

                    {/* New Report Button */}
                    {!showForm && (
                        <button
                            className="btn btn-primary btn-lg mb-lg"
                            onClick={() => setShowForm(true)}
                        >
                            ✏️ Submit New Report
                        </button>
                    )}

                    {/* Report Submission Form */}
                    {showForm && (
                        <div className="card report-form-card animate-fade-in">
                            <div className="card-header">
                                <h3>📝 New Report</h3>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Report Type</label>
                                    <div className="toggle-container">
                                        <button
                                            type="button"
                                            className={`toggle-btn ${formData.type === 'daily' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'daily' })}
                                        >
                                            📅 Daily Log
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn ${formData.type === 'weekly' ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'weekly' })}
                                        >
                                            📆 Weekly Report
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Summary</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder={formData.type === 'daily'
                                            ? "What did you accomplish today? Any blockers or challenges?"
                                            : "Summarize your week's progress, achievements, and learnings..."
                                        }
                                        value={formData.summary}
                                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Attachments (Optional)</label>
                                    <FileDropzone
                                        onFileSelect={setSelectedFile}
                                        currentFile={selectedFile}
                                        onRemove={() => setSelectedFile(null)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : '🚀 Submit Report'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Reports List */}
                    <div className="reports-section">
                        <h2 className="section-title">📋 Your Reports</h2>

                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading reports...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📭</div>
                                <h3>No reports yet</h3>
                                <p>Start by submitting your first report!</p>
                            </div>
                        ) : (
                            <div className="reports-list">
                                {reports.map((report) => (
                                    <div key={report._id} className="report-card animate-slide-in">
                                        <div className="report-card-header">
                                            <div className="report-meta">
                                                <span className={`report-type type-${report.type}`}>
                                                    {report.type === 'daily' ? '📅 Daily' : '📆 Weekly'}
                                                </span>
                                                <StatusBadge status={report.status} />
                                            </div>
                                            <span className="report-date">{formatDate(report.createdAt)}</span>
                                        </div>

                                        <p className="report-summary">{report.summary}</p>

                                        {report.fileName && (
                                            <div className="report-attachment">
                                                📎 {report.fileName}
                                            </div>
                                        )}

                                        {/* Show rating if graded */}
                                        {report.status === 'graded' && (
                                            <div className="report-grade">
                                                <div className="grade-item">
                                                    <span className="grade-label">Rating:</span>
                                                    <StarRating rating={report.rating} readonly size="sm" />
                                                </div>
                                                {report.marks !== undefined && (
                                                    <div className="grade-item">
                                                        <span className="grade-label">Marks:</span>
                                                        <span className="grade-value">{report.marks}/100</span>
                                                    </div>
                                                )}
                                                {report.adminFeedback && (
                                                    <div className="grade-feedback">
                                                        <span className="grade-label">Feedback:</span>
                                                        <p>{report.adminFeedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Undo button - only visible when status is 'submitted' */}
                                        {report.status === 'submitted' && (
                                            <div className="report-actions">
                                                <button
                                                    className="btn btn-warning btn-sm"
                                                    onClick={() => handleUndo(report._id)}
                                                >
                                                    ↩️ Undo Submission
                                                </button>
                                                <span className="undo-hint">
                                                    (Available until admin starts reviewing)
                                                </span>
                                            </div>
                                        )}

                                        {/* Status info for under review */}
                                        {report.status === 'under_review' && (
                                            <div className="report-info">
                                                ⏳ Admin is currently reviewing this report...
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default InternDashboard;
