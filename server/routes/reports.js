const express = require('express');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// ============================================
// INTERN ROUTES
// ============================================

// @route   POST /api/reports
// @desc    Create a new report (as draft or submitted)
// @access  Private (Intern)
router.post('/', protect, authorize('intern'), upload.single('file'), async (req, res) => {
    try {
        const { type, summary, submitNow } = req.body;

        const reportData = {
            intern: req.user._id,
            type,
            summary,
            status: submitNow === 'true' ? 'submitted' : 'draft'
        };

        // Handle file upload
        if (req.file) {
            reportData.fileUrl = `/uploads/${req.file.filename}`;
            reportData.fileName = req.file.originalname;
            reportData.fileType = req.file.mimetype;
        }

        // Set submitted timestamp if submitting now
        if (submitNow === 'true') {
            reportData.submittedAt = new Date();
        }

        const report = await Report.create(reportData);

        res.status(201).json({
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

// @route   GET /api/reports/my
// @desc    Get all reports for the logged-in intern
// @access  Private (Intern)
router.get('/my', protect, authorize('intern'), async (req, res) => {
    try {
        const reports = await Report.find({ intern: req.user._id })
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

// @route   PUT /api/reports/:id
// @desc    Update a draft report
// @access  Private (Intern)
router.put('/:id', protect, authorize('intern'), upload.single('file'), async (req, res) => {
    try {
        let report = await Report.findById(req.params.id);

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
            // Delete old file if exists
            if (report.fileUrl) {
                const oldPath = path.join(__dirname, '..', report.fileUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            report.fileUrl = `/uploads/${req.file.filename}`;
            report.fileName = req.file.originalname;
            report.fileType = req.file.mimetype;
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
router.put('/:id/submit', protect, authorize('intern'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

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
                message: 'Not authorized'
            });
        }

        // Only submit drafts
        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Report is not in draft status'
            });
        }

        report.status = 'submitted';
        report.submittedAt = new Date();
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

// @route   PUT /api/reports/:id/undo
// @desc    Undo submission (pull back to draft)
// @access  Private (Intern)
router.put('/:id/undo', protect, authorize('intern'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

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
                message: 'Not authorized'
            });
        }

        // CRITICAL: Only allow undo if status is 'submitted'
        // Cannot undo if admin has started reviewing or already graded
        if (report.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: `Cannot undo. Report is currently "${report.status}". Undo is only allowed when status is "submitted".`
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

// ============================================
// ADMIN ROUTES
// ============================================

// @route   GET /api/reports
// @desc    Get all submitted reports (Admin roster view)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, sortBy } = req.query;

        // Build query - admins can see everything except drafts
        let query = { status: { $ne: 'draft' } };

        if (status && status !== 'all') {
            query.status = status;
        }

        // Build sort
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
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const stats = await Report.aggregate([
            { $match: { status: { $ne: 'draft' } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            submitted: 0,
            under_review: 0,
            graded: 0
        };

        stats.forEach(s => {
            formattedStats[s._id] = s.count;
        });

        formattedStats.total = formattedStats.submitted + formattedStats.under_review + formattedStats.graded;

        res.json({
            success: true,
            stats: formattedStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/reports/:id
// @desc    Get single report and mark as under review
// @access  Private (Admin)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('intern', 'name email department')
            .populate('reviewedBy', 'name');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // If status is 'submitted', mark as 'under_review'
        // This locks the intern's undo capability
        if (report.status === 'submitted') {
            report.status = 'under_review';
            report.reviewedBy = req.user._id;
            await report.save();
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

// @route   PUT /api/reports/:id/grade
// @desc    Grade a report
// @access  Private (Admin)
router.put('/:id/grade', protect, authorize('admin'), async (req, res) => {
    try {
        const { rating, marks, adminFeedback } = req.body;

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Can only grade reports that are under review or re-grade already graded
        if (report.status === 'draft' || report.status === 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Report must be under review before grading'
            });
        }

        // Validate rating
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Validate marks
        if (marks !== undefined && (marks < 0 || marks > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Marks must be between 0 and 100'
            });
        }

        // Update report
        if (rating) report.rating = rating;
        if (marks !== undefined) report.marks = marks;
        if (adminFeedback) report.adminFeedback = adminFeedback;
        report.status = 'graded';
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        await report.save();

        const populatedReport = await Report.findById(report._id)
            .populate('intern', 'name email department')
            .populate('reviewedBy', 'name');

        res.json({
            success: true,
            message: 'Report graded successfully',
            report: populatedReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report (Intern - only drafts, Admin - any)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Interns can only delete their own drafts
        if (req.user.role === 'intern') {
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
        }

        // Delete associated file
        if (report.fileUrl) {
            const filePath = path.join(__dirname, '..', report.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Report.findByIdAndDelete(req.params.id);

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

module.exports = router;
