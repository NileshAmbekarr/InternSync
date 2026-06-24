import { useState, useEffect } from 'react';
import {
    FileText,
    PenLine,
    Send,
    CheckCircle2,
    Plus,
    Calendar,
    CalendarDays,
    Paperclip,
    Undo2,
    Clock,
    Inbox,
    X,
    MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import FileDropzone from '../components/FileDropzone';
import StarRating from '../components/StarRating';
import CommentThread from '../components/CommentThread';
import toast from 'react-hot-toast';
import './InternDashboard.css';

const InternDashboard = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ type: 'daily', summary: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [openThread, setOpenThread] = useState(null);

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
            if (selectedFile) data.append('file', selectedFile);

            await reportsAPI.create(data);
            toast.success('Report submitted successfully');
            setFormData({ type: 'daily', summary: '' });
            setSelectedFile(null);
            setShowForm(false);
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

    const stats = {
        total: reports.length,
        draft: reports.filter((r) => r.status === 'draft').length,
        submitted: reports.filter((r) => r.status === 'submitted').length,
        graded: reports.filter((r) => r.status === 'graded').length,
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    return (
        <div className="page">
            <div className="container">
                <div className="page-header flex justify-between items-center flex-wrap gap-md">
                    <div>
                        <h1 className="page-title">Welcome back, {user?.name}</h1>
                        <p className="page-subtitle">Track your progress and submit your reports.</p>
                    </div>
                    {!showForm && (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <Plus size={16} />
                            New Report
                        </button>
                    )}
                </div>

                <div className="grid grid-4 mb-xl">
                    <StatCard icon={FileText} value={stats.total} label="Total Reports" />
                    <StatCard icon={PenLine} value={stats.draft} label="Drafts" />
                    <StatCard icon={Send} value={stats.submitted} label="Submitted" />
                    <StatCard icon={CheckCircle2} value={stats.graded} label="Graded" />
                </div>

                {showForm && (
                    <div className="card report-form-card animate-fade-in mb-xl">
                        <div className="card-header">
                            <h3>New Report</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                                <X size={14} />
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
                                        <Calendar size={16} />
                                        Daily Log
                                    </button>
                                    <button
                                        type="button"
                                        className={`toggle-btn ${formData.type === 'weekly' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, type: 'weekly' })}
                                    >
                                        <CalendarDays size={16} />
                                        Weekly Report
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Summary</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder={formData.type === 'daily'
                                        ? 'What did you accomplish today? Any blockers or challenges?'
                                        : "Summarize your week's progress, achievements, and learnings..."}
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    rows={6}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Attachment (optional)</label>
                                <FileDropzone
                                    onFileSelect={setSelectedFile}
                                    currentFile={selectedFile}
                                    onRemove={() => setSelectedFile(null)}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="reports-section">
                    <h2 className="section-title">Your Reports</h2>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner" />
                            <p>Loading reports...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title="No reports yet"
                            description="Submit your first report to get started."
                        >
                            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                                <Plus size={16} />
                                New Report
                            </button>
                        </EmptyState>
                    ) : (
                        <div className="reports-list">
                            {reports.map((report) => (
                                <div key={report._id} className="report-card animate-slide-in">
                                    <div className="report-card-header">
                                        <div className="report-meta">
                                            <span className={`report-type type-${report.type}`}>
                                                {report.type === 'daily' ? <Calendar size={14} /> : <CalendarDays size={14} />}
                                                {report.type === 'daily' ? 'Daily' : 'Weekly'}
                                            </span>
                                            <StatusBadge status={report.status} />
                                        </div>
                                        <span className="report-date">{formatDate(report.createdAt)}</span>
                                    </div>

                                    <p className="report-summary">{report.summary}</p>

                                    {report.fileName && (
                                        <div className="report-attachment">
                                            <Paperclip size={14} />
                                            {report.fileName}
                                        </div>
                                    )}

                                    {report.status === 'graded' && (
                                        <div className="report-grade">
                                            <div className="grade-item">
                                                <span className="grade-label">Rating</span>
                                                <StarRating rating={report.rating} readonly size="sm" />
                                            </div>
                                            {report.marks !== undefined && (
                                                <div className="grade-item">
                                                    <span className="grade-label">Marks</span>
                                                    <span className="grade-value">{report.marks}/100</span>
                                                </div>
                                            )}
                                            {report.adminFeedback && (
                                                <div className="grade-feedback">
                                                    <span className="grade-label">Feedback</span>
                                                    <p>{report.adminFeedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {report.status === 'submitted' && (
                                        <div className="report-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleUndo(report._id)}>
                                                <Undo2 size={14} />
                                                Undo Submission
                                            </button>
                                            <span className="undo-hint">Available until an admin starts reviewing</span>
                                        </div>
                                    )}

                                    {report.status === 'under_review' && (
                                        <div className="report-info">
                                            <Clock size={14} />
                                            An admin is currently reviewing this report
                                        </div>
                                    )}

                                    <div className="report-footer">
                                        <button
                                            className="thread-toggle"
                                            onClick={() => setOpenThread(openThread === report._id ? null : report._id)}
                                        >
                                            <MessageSquare size={14} />
                                            {openThread === report._id ? 'Hide discussion' : 'Discussion'}
                                        </button>
                                    </div>

                                    {openThread === report._id && (
                                        <div className="report-thread">
                                            <CommentThread reportId={report._id} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InternDashboard;
