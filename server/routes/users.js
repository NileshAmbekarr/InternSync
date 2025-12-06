const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/interns
// @desc    Get all interns with their report stats
// @access  Private (Admin)
router.get('/interns', protect, authorize('admin'), async (req, res) => {
    try {
        // Get all interns
        const interns = await User.find({ role: 'intern' }).select('-password');

        // Get report counts for each intern
        const internData = await Promise.all(
            interns.map(async (intern) => {
                const reportStats = await Report.aggregate([
                    { $match: { intern: intern._id } },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const stats = {
                    draft: 0,
                    submitted: 0,
                    under_review: 0,
                    graded: 0
                };

                reportStats.forEach(s => {
                    stats[s._id] = s.count;
                });

                return {
                    ...intern.toObject(),
                    reportStats: stats,
                    totalReports: stats.draft + stats.submitted + stats.under_review + stats.graded,
                    pendingReview: stats.submitted + stats.under_review
                };
            })
        );

        res.json({
            success: true,
            count: internData.length,
            interns: internData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get single user profile
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, department } = req.body;

        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (department) user.department = department;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
