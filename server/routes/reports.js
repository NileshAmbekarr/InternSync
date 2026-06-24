const express = require('express');
const Report = require('../models/Report');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { attachOrganization, checkStorageLimit } = require('../middleware/organization');
const upload = require('../middleware/upload');
const fileService = require('../utils/fileService');
const Comment = require('../models/Comment');
const { notifyUser, notifyOrgAdmins } = require('../utils/notify');

const router = express.Router();

// Apply org middleware to all routes
router.use(protect);
router.use(attachOrganization);

// ============================================
// INTERN ROUTES
// ============================================

// @route   POST /api/reports
// @desc    Create a new report (as draft or submitted)
// @access  Private (Intern)
router.post('/', authorize('intern'), upload.single('file'), async (req, res) => {
    try {
        const { type, summary, submitNow } = req.body;

        const reportData = {
            organizationId: req.organizationId,
            intern: req.user._id,
            type,
            summary,
            status: submitNow === 'true' ? 'submitted' : 'draft'
        };

        // Handle file upload
        if (req.file) {
            const fileSizeMB = req.file.size / (1024 * 1024);

            // Check storage limit
            if (!req.organization.hasStorageSpace(fileSizeMB)) {
                return res.status(403).json({
                    success: false,
                    message: `Storage limit exceeded. You have ${req.organization.usage.storageUsedMB.toFixed(1)}MB of ${req.organization.limits.maxStorageMB}MB used.`,
                    upgradeRequired: true
                });
            }

            // Upload file (R2 or local)
            const fileData = await fileService.uploadFile(req.file, req.organizationId.toString());

            reportData.fileUrl = fileData.fileUrl;
            reportData.fileKey = fileData.fileKey;
            reportData.fileName = fileData.fileName;
            reportData.fileType = fileData.fileType;
            reportData.fileSizeMB = fileData.fileSizeMB;

            // Update org storage usage
            await Organization.findByIdAndUpdate(req.organizationId, {
                $inc: { 'usage.storageUsedMB': fileSizeMB }
            });
        }

        // Set submitted timestamp if submitting now
        if (submitNow === 'true') {
            reportData.submittedAt = new Date();
        }

        const report = await Report.create(reportData);

        // Notify admins/owners when a report is submitted (not for drafts)
        if (report.status === 'submitted') {
            await notifyOrgAdmins(req.organizationId, {
                excludeUserId: req.user._id,
                type: 'report_submitted',
                title: 'New report submitted',
                message: `${req.user.name} submitted a ${report.type} report.`,
                link: `/admin/review/${report._id}`
            });
        }

        res.status(201).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/reports/my
// @desc    Get all reports for the logged-in intern
// @access  Private (Intern)
router.get('/my', authorize('intern'), async (req, res) => {
    try {
        const reports = await Report.find({
            organizationId: req.organizationId,
            intern: req.user._id
        })
            .sort({ createdAt: -1 })
            .populate('reviewedBy', 'name');

        res.json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/reports/download/:id
// @desc    Get download URL for a report file
// @access  Private (Owner of report or Admin)
router.get('/download/:id', async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check access - must be owner or admin
        const isOwner = report.intern.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'owner'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this file'
            });
        }

        if (!report.fileKey && !report.fileUrl) {
            return res.status(404).json({
                success: false,
                message: 'No file attached to this report'
            });
        }

        const downloadUrl = await fileService.getDownloadUrl(report);

        res.json({
            success: true,
            downloadUrl,
            fileName: report.fileName,
            fileType: report.fileType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/reports/:id
// @desc    Update a draft report
// @access  Private (Intern)
router.put('/:id', authorize('intern'), upload.single('file'), async (req, res) => {
    try {
        let report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check ownership
        if (report.intern.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this report'
            });
        }

        // Only allow editing drafts
        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only edit reports in draft status'
            });
        }

        const { type, summary } = req.body;

        // Update fields
        if (type) report.type = type;
        if (summary) report.summary = summary;

        // Handle new file upload
        if (req.file) {
            const newFileSizeMB = req.file.size / (1024 * 1024);
            const oldFileSizeMB = report.fileSizeMB || 0;
            const sizeDiff = newFileSizeMB - oldFileSizeMB;

            // Check storage limit
            if (sizeDiff > 0 && !req.organization.hasStorageSpace(sizeDiff)) {
                return res.status(403).json({
                    success: false,
                    message: 'Storage limit exceeded',
                    upgradeRequired: true
                });
            }

            // Delete old file
            await fileService.deleteFile(report);

            // Upload new file
            const fileData = await fileService.uploadFile(req.file, req.organizationId.toString());

            report.fileUrl = fileData.fileUrl;
            report.fileKey = fileData.fileKey;
            report.fileName = fileData.fileName;
            report.fileType = fileData.fileType;
            report.fileSizeMB = fileData.fileSizeMB;

            // Update org storage
            await Organization.findByIdAndUpdate(req.organizationId, {
                $inc: { 'usage.storageUsedMB': sizeDiff }
            });
        }

        await report.save();

        res.json({
            success: true,
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/reports/:id/submit
// @desc    Submit a draft report
// @access  Private (Intern)
router.put('/:id/submit', authorize('intern'), async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (report.intern.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Report is not in draft status'
            });
        }

        report.status = 'submitted';
        report.submittedAt = new Date();
        await report.save();

        await notifyOrgAdmins(req.organizationId, {
            excludeUserId: req.user._id,
            type: 'report_submitted',
            title: 'New report submitted',
            message: `${req.user.name} submitted a ${report.type} report.`,
            link: `/admin/review/${report._id}`
        });

        res.json({
            success: true,
            message: 'Report submitted successfully',
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/reports/:id/undo
// @desc    Undo submission - return to draft (only if not reviewed yet)
// @access  Private (Intern)
router.put('/:id/undo', authorize('intern'), async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (report.intern.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (report.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: `Cannot undo. Report is "${report.status}". Undo only allowed when "submitted".`
            });
        }

        report.status = 'draft';
        report.submittedAt = null;
        await report.save();

        res.json({
            success: true,
            message: 'Report returned to draft',
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a draft report
// @access  Private (Intern)
router.delete('/:id', authorize('intern'), async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (report.intern.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete draft reports'
            });
        }

        // Delete file and update storage
        if (report.fileSizeMB > 0) {
            await fileService.deleteFile(report);

            await Organization.findByIdAndUpdate(req.organizationId, {
                $inc: { 'usage.storageUsedMB': -report.fileSizeMB }
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Report deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// ADMIN ROUTES
// ============================================

// @route   GET /api/reports
// @desc    Get all submitted reports for this org (Admin view)
// @access  Private (Admin/Owner)
router.get('/', authorize('admin', 'owner'), async (req, res) => {
    try {
        const { status, sortBy } = req.query;

        let query = {
            organizationId: req.organizationId,
            status: { $ne: 'draft' }
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        let sort = { submittedAt: -1 };
        if (sortBy === 'status') {
            sort = { status: 1, submittedAt: -1 };
        } else if (sortBy === 'intern') {
            sort = { intern: 1, submittedAt: -1 };
        }

        const reports = await Report.find(query)
            .populate('intern', 'name email department')
            .populate('reviewedBy', 'name')
            .sort(sort);

        res.json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/reports/stats
// @desc    Get statistics for admin dashboard
// @access  Private (Admin/Owner)
router.get('/stats', authorize('admin', 'owner'), async (req, res) => {
    try {
        const stats = await Report.aggregate([
            {
                $match: {
                    organizationId: req.organizationId,
                    status: { $ne: 'draft' }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            total: 0,
            submitted: 0,
            under_review: 0,
            graded: 0
        };

        stats.forEach(s => {
            result[s._id] = s.count;
            result.total += s.count;
        });

        res.json({
            success: true,
            stats: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/reports/analytics
// @desc    Aggregated analytics for the admin dashboard
// @access  Private (Admin/Owner)
router.get('/analytics', authorize('admin', 'owner'), async (req, res) => {
    try {
        const orgId = req.organizationId;
        const since = new Date();
        since.setDate(since.getDate() - 29);
        since.setHours(0, 0, 0, 0);

        const [statusAgg, typeAgg, gradeAgg, trendAgg, topInternsAgg] = await Promise.all([
            // Status distribution (exclude drafts)
            Report.aggregate([
                { $match: { organizationId: orgId, status: { $ne: 'draft' } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Reports by type
            Report.aggregate([
                { $match: { organizationId: orgId, status: { $ne: 'draft' } } },
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),
            // Average rating / marks across graded reports
            Report.aggregate([
                { $match: { organizationId: orgId, status: 'graded' } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating' },
                        avgMarks: { $avg: '$marks' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Submissions per day for the last 30 days
            Report.aggregate([
                {
                    $match: {
                        organizationId: orgId,
                        submittedAt: { $gte: since }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Top interns by graded count and average marks
            Report.aggregate([
                { $match: { organizationId: orgId, status: { $ne: 'draft' } } },
                {
                    $group: {
                        _id: '$intern',
                        reports: { $sum: 1 },
                        graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
                        avgMarks: { $avg: '$marks' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'intern'
                    }
                },
                { $unwind: '$intern' },
                {
                    $project: {
                        _id: 0,
                        name: '$intern.name',
                        reports: 1,
                        graded: 1,
                        avgMarks: { $round: [{ $ifNull: ['$avgMarks', 0] }, 1] }
                    }
                },
                { $sort: { avgMarks: -1, reports: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Normalize status distribution
        const statusDistribution = { submitted: 0, under_review: 0, graded: 0 };
        let totalReports = 0;
        statusAgg.forEach((s) => {
            statusDistribution[s._id] = s.count;
            totalReports += s.count;
        });

        // Normalize reports by type
        const reportsByType = { daily: 0, weekly: 0 };
        typeAgg.forEach((t) => {
            reportsByType[t._id] = t.count;
        });

        // Build a continuous 30-day trend (fill gaps with 0)
        const trendMap = Object.fromEntries(trendAgg.map((d) => [d._id, d.count]));
        const trend = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            trend.push({ date: key, count: trendMap[key] || 0 });
        }

        const grade = gradeAgg[0] || {};

        res.json({
            success: true,
            analytics: {
                totalReports,
                statusDistribution,
                reportsByType,
                avgRating: grade.avgRating ? Number(grade.avgRating.toFixed(1)) : 0,
                avgMarks: grade.avgMarks ? Number(grade.avgMarks.toFixed(1)) : 0,
                gradedCount: grade.count || 0,
                trend,
                topInterns: topInternsAgg
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Private (Admin/Owner or Owner of report)
router.get('/:id', async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        })
            .populate('intern', 'name email department')
            .populate('reviewedBy', 'name');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check access
        const isOwner = report.intern._id.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'owner'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.json({
            success: true,
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/reports/:id/review
// @desc    Start review - set status to under_review
// @access  Private (Admin/Owner)
router.put('/:id/review', authorize('admin', 'owner'), async (req, res) => {
    try {
        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (report.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Report is not in submitted status'
            });
        }

        report.status = 'under_review';
        report.reviewedBy = req.user._id;
        await report.save();

        await notifyUser(report.intern, {
            organizationId: req.organizationId,
            type: 'report_reviewed',
            title: 'Your report is under review',
            message: `${req.user.name} started reviewing your ${report.type} report.`,
            link: '/my-reports'
        });

        res.json({
            success: true,
            message: 'Review started',
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/reports/:id/grade
// @desc    Grade a report
// @access  Private (Admin/Owner)
router.put('/:id/grade', authorize('admin', 'owner'), async (req, res) => {
    try {
        const { rating, marks, adminFeedback } = req.body;

        const report = await Report.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (!['submitted', 'under_review'].includes(report.status)) {
            return res.status(400).json({
                success: false,
                message: 'Report must be submitted or under review to grade'
            });
        }

        report.status = 'graded';
        report.rating = rating;
        report.marks = marks;
        report.adminFeedback = adminFeedback;
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        await report.save();

        await notifyUser(report.intern, {
            organizationId: req.organizationId,
            type: 'report_graded',
            title: 'Your report was graded',
            message: `${req.user.name} graded your ${report.type} report${report.marks != null ? ` — ${report.marks}/100` : ''}.`,
            link: '/my-reports'
        });

        res.json({
            success: true,
            message: 'Report graded successfully',
            report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// COMMENTS (discussion thread on a report)
// ============================================

// Load the report and verify the caller may access its thread
const loadReportForThread = async (req, res) => {
    const report = await Report.findOne({
        _id: req.params.id,
        organizationId: req.organizationId
    });

    if (!report) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return null;
    }

    const isReportOwner = report.intern.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'owner'].includes(req.user.role);

    if (!isReportOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return null;
    }

    return report;
};

// @route   GET /api/reports/:id/comments
// @desc    List the comment thread for a report
// @access  Private (report owner or admin/owner)
router.get('/:id/comments', async (req, res) => {
    try {
        const report = await loadReportForThread(req, res);
        if (!report) return;

        const comments = await Comment.find({ report: report._id })
            .populate('author', 'name role')
            .sort({ createdAt: 1 });

        res.json({ success: true, count: comments.length, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/reports/:id/comments
// @desc    Add a comment to a report's thread
// @access  Private (report owner or admin/owner)
router.post('/:id/comments', async (req, res) => {
    try {
        const report = await loadReportForThread(req, res);
        if (!report) return;

        const { body } = req.body;
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
        }

        let comment = await Comment.create({
            organizationId: req.organizationId,
            report: report._id,
            author: req.user._id,
            body: body.trim()
        });
        comment = await comment.populate('author', 'name role');

        // Notify the other side of the conversation
        if (req.user.role === 'intern') {
            await notifyOrgAdmins(req.organizationId, {
                excludeUserId: req.user._id,
                type: 'report_comment',
                title: 'New comment on a report',
                message: `${req.user.name} commented on a ${report.type} report.`,
                link: `/admin/review/${report._id}`
            });
        } else if (report.intern.toString() !== req.user._id.toString()) {
            await notifyUser(report.intern, {
                organizationId: req.organizationId,
                type: 'report_comment',
                title: 'New comment on your report',
                message: `${req.user.name} commented on your ${report.type} report.`,
                link: '/my-reports'
            });
        }

        res.status(201).json({ success: true, comment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/reports/:id/comments/:commentId
// @desc    Delete a comment (author, or any admin/owner)
// @access  Private
router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.commentId,
            report: req.params.id,
            organizationId: req.organizationId
        });

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const isAuthor = comment.author.toString() === req.user._id.toString();
        const isAdmin = ['admin', 'owner'].includes(req.user.role);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await comment.deleteOne();
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
