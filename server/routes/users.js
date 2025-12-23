const express = require('express');
const User = require('../models/User');
const Report = require('../models/Report');
const Organization = require('../models/Organization');
const { protect, authorize } = require('../middleware/auth');
const { attachOrganization, requireOwner } = require('../middleware/organization');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(attachOrganization);

// @route   GET /api/users/interns
// @desc    Get all interns with report stats (org-scoped)
// @access  Private (Admin/Owner)
router.get('/interns', authorize('admin', 'owner'), async (req, res) => {
    try {
        // Get all interns in this org
        const interns = await User.find({
            organizationId: req.organizationId,
            role: 'intern',
            isActive: true
        }).select('-password');

        // Get report counts for each intern
        const internData = await Promise.all(
            interns.map(async (intern) => {
                const reportStats = await Report.aggregate([
                    {
                        $match: {
                            organizationId: req.organizationId,
                            intern: intern._id
                        }
                    },
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

// @route   GET /api/users/team
// @desc    Get all team members (admins + interns)
// @access  Private (Admin/Owner)
router.get('/team', authorize('admin', 'owner'), async (req, res) => {
    try {
        const users = await User.find({
            organizationId: req.organizationId
        }).select('-password').sort({ role: 1, name: 1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get single user profile (org-scoped)
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        }).select('-password');

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
// @desc    Update own profile
// @access  Private
router.put('/profile', async (req, res) => {
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

// @route   PUT /api/users/:id/deactivate
// @desc    Deactivate a user (terminate intern/admin)
// @access  Private (Owner only)
router.put('/:id/deactivate', requireOwner, async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Cannot deactivate owner
        if (user.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate organization owner'
            });
        }

        // Cannot deactivate self
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate yourself'
            });
        }

        user.isActive = false;
        await user.save();

        // Update org usage
        const org = await Organization.findById(req.organizationId);
        if (user.role === 'intern') {
            org.usage.currentInterns = Math.max(0, org.usage.currentInterns - 1);
        } else if (user.role === 'admin') {
            org.usage.currentAdmins = Math.max(0, org.usage.currentAdmins - 1);
        }
        await org.save();

        res.json({
            success: true,
            message: `${user.name} has been deactivated`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/users/:id/reactivate
// @desc    Reactivate a user
// @access  Private (Owner only)
router.put('/:id/reactivate', requireOwner, async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.params.id,
            organizationId: req.organizationId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check limits before reactivating
        const org = await Organization.findById(req.organizationId);
        if (user.role === 'intern' && !org.canAddIntern()) {
            return res.status(403).json({
                success: false,
                message: 'Intern limit reached. Upgrade to reactivate.',
                upgradeRequired: true
            });
        }
        if (user.role === 'admin' && !org.canAddAdmin()) {
            return res.status(403).json({
                success: false,
                message: 'Admin limit reached. Upgrade to reactivate.',
                upgradeRequired: true
            });
        }

        user.isActive = true;
        await user.save();

        // Update org usage
        if (user.role === 'intern') {
            org.usage.currentInterns += 1;
        } else if (user.role === 'admin') {
            org.usage.currentAdmins += 1;
        }
        await org.save();

        res.json({
            success: true,
            message: `${user.name} has been reactivated`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
