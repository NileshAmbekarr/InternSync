const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
    },
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    limits: {
        maxInterns: {
            type: Number,
            default: 5 // Free tier
        },
        maxAdmins: {
            type: Number,
            default: 2
        },
        maxStorageMB: {
            type: Number,
            default: 100 // 100MB for free tier
        }
    },
    usage: {
        currentInterns: {
            type: Number,
            default: 0
        },
        currentAdmins: {
            type: Number,
            default: 1 // Owner counts as admin
        },
        storageUsedMB: {
            type: Number,
            default: 0
        }
    },
    settings: {
        allowGoogleAuth: {
            type: Boolean,
            default: true
        },
        requireEmailVerification: {
            type: Boolean,
            default: false
        },
        reportTypes: {
            type: [String],
            default: ['daily', 'weekly']
        }
    },
    billing: {
        stripeCustomerId: String,
        subscriptionId: String,
        subscriptionStatus: {
            type: String,
            enum: ['active', 'canceled', 'past_due', 'trialing', null],
            default: null
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate slug from name
organizationSchema.pre('validate', function (next) {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Get plan limits
organizationSchema.methods.getPlanLimits = function () {
    const planLimits = {
        free: { maxInterns: 5, maxAdmins: 2, maxStorageMB: 100 },
        pro: { maxInterns: 50, maxAdmins: 10, maxStorageMB: 1000 },
        enterprise: { maxInterns: -1, maxAdmins: -1, maxStorageMB: 10000 } // -1 = unlimited
    };
    return planLimits[this.plan] || planLimits.free;
};

// Check if can add intern
organizationSchema.methods.canAddIntern = function () {
    const limits = this.getPlanLimits();
    if (limits.maxInterns === -1) return true; // Unlimited
    return this.usage.currentInterns < limits.maxInterns;
};

// Check if can add admin
organizationSchema.methods.canAddAdmin = function () {
    const limits = this.getPlanLimits();
    if (limits.maxAdmins === -1) return true;
    return this.usage.currentAdmins < limits.maxAdmins;
};

// Check storage limit
organizationSchema.methods.hasStorageSpace = function (fileSizeMB) {
    const limits = this.getPlanLimits();
    if (limits.maxStorageMB === -1) return true;
    return (this.usage.storageUsedMB + fileSizeMB) <= limits.maxStorageMB;
};

module.exports = mongoose.model('Organization', organizationSchema);
