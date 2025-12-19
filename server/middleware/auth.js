const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// Role-based authorization - now supports 'owner' role
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Owner has access to everything admin has
        const userRole = req.user.role;
        const effectiveRoles = [...roles];

        // If admin is in roles, owner should also have access
        if (roles.includes('admin') && !roles.includes('owner')) {
            effectiveRoles.push('owner');
        }

        if (!effectiveRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `User role '${userRole}' is not authorized`
            });
        }
        next();
    };
};
