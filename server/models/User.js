const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required']
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['intern', 'admin', 'owner'],
        default: 'intern'
    },
    department: {
        type: String,
        trim: true
    },
    // Google OAuth
    googleId: {
        type: String,
        sparse: true
    },
    // Email verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Invitation
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invitedAt: Date,
    inviteToken: String,
    inviteTokenExpires: Date,
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound unique index: email must be unique within an organization
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return token;
};

// Generate invite token
userSchema.methods.generateInviteToken = function () {
    const token = crypto.randomBytes(32).toString('hex');

    this.inviteToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.inviteTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    return token;
};

// Check if user is org owner
userSchema.methods.isOwner = function () {
    return this.role === 'owner';
};

// Check if user can manage others (admin or owner)
userSchema.methods.canManageUsers = function () {
    return ['admin', 'owner'].includes(this.role);
};

module.exports = mongoose.model('User', userSchema);
