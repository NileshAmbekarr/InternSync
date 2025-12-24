import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import './ReviewReport.css';

const ReviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        rating: 0,
        marks: '',
        adminFeedback: '',
    });

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            const response = await reportsAPI.getOne(id);
            const reportData = response.data.report;
            setReport(reportData);

            // Pre-fill form if already graded
            if (reportData.status === 'graded') {
                setFormData({
                    rating: reportData.rating || 0,
                    marks: reportData.marks?.toString() || '',
                    adminFeedback: reportData.adminFeedback || '',
                });
            }
        } catch (error) {
            toast.error('Failed to load report');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const response = await reportsAPI.getDownloadUrl(id);
            const { downloadUrl, fileName } = response.data;

            // Open the download URL in a new tab/window
            // For R2: this will be a signed URL
            // For local: this will be /uploads/filename
            if (downloadUrl.startsWith('/uploads')) {
                // Local file - construct full URL
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                window.open(`${baseUrl}${downloadUrl}`, '_blank');
            } else {
                // R2 signed URL - use directly
                window.open(downloadUrl, '_blank');
            }
        } catch (error) {
            toast.error('Failed to get download link');
        } finally {
            setDownloading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.rating) {
            toast.error('Please provide a rating');
            return;
        }

        if (!formData.marks || formData.marks < 0 || formData.marks > 100) {
            toast.error('Please provide marks between 0 and 100');
            return;
        }

        setSaving(true);

        try {
            await reportsAPI.grade(id, {
                rating: formData.rating,
                marks: parseInt(formData.marks),
                adminFeedback: formData.adminFeedback,
            });
            toast.success('Report graded successfully!');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save grade');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="page">
                    <div className="container">
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading report...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!report) {
        return (
            <>
                <Navbar />
                <div className="page">
                    <div className="container">
                        <div className="empty-state">
                            <h3>Report not found</h3>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="page">
                <div className="container">
                    {/* Back Button */}
                    <button
                        className="btn btn-secondary mb-lg"
                        onClick={() => navigate('/admin')}
                    >
                        ← Back to Dashboard
                    </button>

                    <div className="review-layout">
                        {/* Report Details */}
                        <div className="review-main">
                            <div className="card">
                                <div className="card-header">
                                    <div>
                                        <h2 className="review-title">
                                            {report.type === 'daily' ? '📅 Daily Report' : '📆 Weekly Report'}
                                        </h2>
                                        <p className="review-meta">
                                            Submitted on {formatDate(report.submittedAt)}
                                        </p>
                                    </div>
                                    <StatusBadge status={report.status} />
                                </div>

                                {/* Intern Info */}
                                <div className="intern-section">
                                    <h4>👤 Intern Details</h4>
                                    <div className="intern-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Name</span>
                                            <span className="detail-value">{report.intern?.name}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Email</span>
                                            <span className="detail-value">{report.intern?.email}</span>
                                        </div>
                                        {report.intern?.department && (
                                            <div className="detail-item">
                                                <span className="detail-label">Department</span>
                                                <span className="detail-value">{report.intern?.department}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Report Summary */}
                                <div className="summary-section">
                                    <h4>📝 Report Summary</h4>
                                    <div className="summary-content">
                                        {report.summary}
                                    </div>
                                </div>

                                {/* Attachment */}
                                {report.fileName && (
                                    <div className="attachment-section">
                                        <h4>📎 Attachment</h4>
                                        <div className="attachment-card">
                                            <div className="attachment-info">
                                                <span className="attachment-icon">📄</span>
                                                <div className="attachment-details">
                                                    <span className="attachment-name">{report.fileName}</span>
                                                    {report.fileSizeMB && (
                                                        <span className="attachment-size">
                                                            {report.fileSizeMB.toFixed(2)} MB
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleDownload}
                                                disabled={downloading}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                {downloading ? '⏳ Loading...' : '📥 Download'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grading Panel */}
                        <div className="review-sidebar">
                            <div className="card grading-card">
                                <h3>🎯 Assessment</h3>

                                <div className="grading-form">
                                    <div className="form-group">
                                        <label className="form-label">Rating (1-5 stars)</label>
                                        <StarRating
                                            rating={formData.rating}
                                            onChange={(value) => setFormData({ ...formData, rating: value })}
                                            size="lg"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Marks (0-100)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Enter marks"
                                            min="0"
                                            max="100"
                                            value={formData.marks}
                                            onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Feedback (Optional)</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Provide feedback for the intern..."
                                            rows={4}
                                            value={formData.adminFeedback}
                                            onChange={(e) => setFormData({ ...formData, adminFeedback: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        className="btn btn-success btn-lg grading-submit"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : report.status === 'graded' ? '🔄 Update Grade' : '✅ Save Grade'}
                                    </button>

                                    {report.status === 'graded' && (
                                        <p className="grading-info">
                                            ℹ️ Last reviewed on {formatDate(report.reviewedAt)}
                                            {report.reviewedBy && ` by ${report.reviewedBy.name}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReviewReport;
