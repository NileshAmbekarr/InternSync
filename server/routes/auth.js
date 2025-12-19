const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');
const { attachOrganization, checkInternLimit, checkAdminLimit } = require('../middleware/organization');
const { sendVerificationEmail, sendInviteEmail } = require('../utils/email');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new organization with owner (self-serve signup)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, organizationName } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create organization first
        const orgSlug = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Check if slug exists
        const existingOrg = await Organization.findOne({ slug: orgSlug });
        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Organization name already taken. Please choose another.'
            });
        }

        // Create a placeholder user ID for org owner reference
        const tempUserId = new (require('mongoose').Types.ObjectId)();

        // Create organization
        const organization = await Organization.create({
            name: organizationName,
            slug: orgSlug,
            owner: tempUserId,
            usage: { currentAdmins: 1, currentInterns: 0 }
        });

        // Create owner user
        const user = await User.create({
            _id: tempUserId,
            organizationId: organization._id,
            name,
            email,
            password,
            role: 'owner',
            isEmailVerified: false
        });

        // Update org owner reference
        organization.owner = user._id;
        await organization.save();

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Try to send verification email
        const emailSent = await sendVerificationEmail(email, name, verificationToken);

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            emailSent,
            message: 'Organization created successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                organizationId: organization._id
            },
            organization: {
                id: organization._id,
                name: organization.name,
                slug: organization.slug,
                plan: organization.plan
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/invite
// @desc    Invite a user to organization (admin/owner only)
// @access  Private
router.post('/invite', protect, attachOrganization, async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const inviterUser = await User.findById(req.user.id);

        // Validate role
        if (!['intern', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be intern or admin.'
            });
        }

        // Check permissions
        if (!inviterUser.canManageUsers()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to invite users'
            });
        }

        // Only owner can invite admins
        if (role === 'admin' && !inviterUser.isOwner()) {
            return res.status(403).json({
                success: false,
                message: 'Only the organization owner can invite admins'
            });
        }

        // Check limits
        const org = req.organization;
        if (role === 'intern' && !org.canAddIntern()) {
            return res.status(403).json({
                success: false,
                message: `Intern limit reached (${org.limits.maxInterns}). Please upgrade.`,
                upgradeRequired: true
            });
        }
        if (role === 'admin' && !org.canAddAdmin()) {
            return res.status(403).json({
                success: false,
                message: `Admin limit reached (${org.limits.maxAdmins}). Please upgrade.`,
                upgradeRequired: true
            });
        }

        // Check if user already exists in this org
        const existingUser = await User.findOne({
            email,
            organizationId: req.organizationId
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists in this organization'
            });
        }

        // Create pending user with invite token
        const user = new User({
            organizationId: req.organizationId,
            name: name || email.split('@')[0],
            email,
            password: crypto.randomBytes(16).toString('hex'), // Temp password
            role,
            invitedBy: req.user.id,
            invitedAt: new Date(),
            isActive: false // Inactive until they accept
        });

        const inviteToken = user.generateInviteToken();
        await user.save();

        // Send invite email
        const emailSent = await sendInviteEmail(
            email,
            name,
            org.name,
            inviterUser.name,
            inviteToken,
            role
        );

        res.status(201).json({
            success: true,
            message: emailSent ? 'Invitation sent!' : 'User created but email failed',
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Invite error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/accept-invite/:token
// @desc    Accept invitation and set password
// @access  Public
router.post('/accept-invite/:token', async (req, res) => {
    try {
        const { password, name } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            inviteToken: hashedToken,
            inviteTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Update user
        user.password = password;
        if (name) user.name = name;
        user.isActive = true;
        user.isEmailVerified = true; // Invited users are verified
        user.inviteToken = undefined;
        user.inviteTokenExpires = undefined;
        await user.save();

        // Update org usage
        const org = await Organization.findById(user.organizationId);
        if (user.role === 'intern') {
            org.usage.currentInterns += 1;
        } else if (user.role === 'admin') {
            org.usage.currentAdmins += 1;
        }
        await org.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Welcome to the team!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password').populate('organizationId');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                organizationId: user.organizationId._id
            },
            organization: {
                id: user.organizationId._id,
                name: user.organizationId.name,
                slug: user.organizationId.slug,
                plan: user.organizationId.plan
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('organizationId');

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                isEmailVerified: user.isEmailVerified,
                organizationId: user.organizationId._id
            },
            organization: {
                id: user.organizationId._id,
                name: user.organizationId.name,
                slug: user.organizationId.slug,
                plan: user.organizationId.plan,
                limits: user.organizationId.limits,
                usage: user.organizationId.usage
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const token = generateToken(req.user._id);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/oauth-callback?token=${token}`);
    }
);

module.exports = router;
