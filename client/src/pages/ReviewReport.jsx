import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CalendarDays, FileText, Download, Info } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import StarRating from '../components/StarRating';
import CommentThread from '../components/CommentThread';
import toast from 'react-hot-toast';
import './ReviewReport.css';

const ReviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ rating: 0, marks: '', adminFeedback: '' });

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchReport = async () => {
        try {
            const response = await reportsAPI.getOne(id);
            const reportData = response.data.report;
            setReport(reportData);

            if (reportData.status === 'graded') {
                setFormData({
                    rating: reportData.rating || 0,
                    marks: reportData.marks?.toString() || '',
                    adminFeedback: reportData.adminFeedback || '',
                });
            }

            // Opening a submitted report starts the review (and notifies the intern)
            if (reportData.status === 'submitted') {
                try {
                    await reportsAPI.review(id);
                    setReport((prev) => (prev ? { ...prev, status: 'under_review' } : prev));
                } catch {
                    /* already under review or graded; ignore */
                }
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
            const { downloadUrl } = response.data;
            if (downloadUrl.startsWith('/uploads')) {
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                window.open(`${baseUrl}${downloadUrl}`, '_blank');
            } else {
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
                marks: parseInt(formData.marks, 10),
                adminFeedback: formData.adminFeedback,
            });
            toast.success('Report graded successfully');
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
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-container">
                        <div className="spinner" />
                        <p>Loading report...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state"><h3>Report not found</h3></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate('/admin')}>
                    <ArrowLeft size={14} />
                    Back to Dashboard
                </button>

                <div className="review-layout">
                    <div className="review-main">
                        <div className="card">
                            <div className="card-header">
                                <div className="review-heading">
                                    <h2 className="review-title">
                                        {report.type === 'daily' ? <Calendar size={18} /> : <CalendarDays size={18} />}
                                        {report.type === 'daily' ? 'Daily Report' : 'Weekly Report'}
                                    </h2>
                                    <p className="review-meta">Submitted {formatDate(report.submittedAt)}</p>
                                </div>
                                <StatusBadge status={report.status} />
                            </div>

                            <div className="intern-section">
                                <h4 className="review-section-label">Intern Details</h4>
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

                            <div className="summary-section">
                                <h4 className="review-section-label">Report Summary</h4>
                                <div className="summary-content">{report.summary}</div>
                            </div>

                            {report.fileName && (
                                <div className="attachment-section">
                                    <h4 className="review-section-label">Attachment</h4>
                                    <div className="attachment-card">
                                        <div className="attachment-info">
                                            <span className="attachment-icon"><FileText size={18} /></span>
                                            <div className="attachment-details">
                                                <span className="attachment-name">{report.fileName}</span>
                                                {report.fileSizeMB > 0 && (
                                                    <span className="attachment-size">{report.fileSizeMB.toFixed(2)} MB</span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={handleDownload} disabled={downloading} className="btn btn-secondary btn-sm">
                                            <Download size={14} />
                                            {downloading ? 'Loading...' : 'Download'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="card mt-md">
                            <CommentThread reportId={id} />
                        </div>
                    </div>

                    <div className="review-sidebar">
                        <div className="card grading-card">
                            <h3>Assessment</h3>

                            <div className="grading-form">
                                <div className="form-group">
                                    <label className="form-label">Rating</label>
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
                                    <label className="form-label">Feedback (optional)</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Provide feedback for the intern..."
                                        rows={4}
                                        value={formData.adminFeedback}
                                        onChange={(e) => setFormData({ ...formData, adminFeedback: e.target.value })}
                                    />
                                </div>

                                <button className="btn btn-primary btn-lg btn-block" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : report.status === 'graded' ? 'Update Grade' : 'Save Grade'}
                                </button>

                                {report.status === 'graded' && (
                                    <p className="grading-info">
                                        <Info size={13} />
                                        Last reviewed {formatDate(report.reviewedAt)}
                                        {report.reviewedBy && ` by ${report.reviewedBy.name}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewReport;
