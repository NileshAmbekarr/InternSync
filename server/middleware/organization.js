const Organization = require('../models/Organization');
const User = require('../models/User');

// Middleware to attach organization context to request
const attachOrganization = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const user = await User.findById(req.user.id).populate('organizationId');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.organizationId) {
            return res.status(403).json({
                success: false,
                message: 'User does not belong to an organization'
            });
        }

        // Check if organization is active
        const org = user.organizationId;
        if (!org.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Organization has been deactivated'
            });
        }

        // Attach to request
        req.organization = org;
        req.organizationId = org._id;

        next();
    } catch (error) {
        console.error('Organization middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Middleware to check if user can add intern (within limits)
const checkInternLimit = async (req, res, next) => {
    try {
        const org = req.organization;

        if (!org.canAddIntern()) {
            return res.status(403).json({
                success: false,
                message: `Intern limit reached (${org.limits.maxInterns}). Please upgrade your plan.`,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Middleware to check if user can add admin
const checkAdminLimit = async (req, res, next) => {
    try {
        const org = req.organization;

        if (!org.canAddAdmin()) {
            return res.status(403).json({
                success: false,
                message: `Admin limit reached (${org.limits.maxAdmins}). Please upgrade your plan.`,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Middleware to check storage limit before file upload
const checkStorageLimit = async (req, res, next) => {
    try {
        const org = req.organization;

        // File size will be checked after multer processes, but we can do a preliminary check
        if (!org.hasStorageSpace(0)) {
            return res.status(403).json({
                success: false,
                message: `Storage limit reached (${org.limits.maxStorageMB}MB). Please upgrade your plan.`,
                upgradeRequired: true
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Middleware to ensure user is admin or owner
const requireAdminOrOwner = (req, res, next) => {
    if (!['admin', 'owner'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Middleware to ensure user is owner
const requireOwner = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.role !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Owner access required'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    attachOrganization,
    checkInternLimit,
    checkAdminLimit,
    checkStorageLimit,
    requireAdminOrOwner,
    requireOwner
};
