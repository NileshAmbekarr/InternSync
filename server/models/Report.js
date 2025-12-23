const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required']
    },
    intern: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'weekly'],
        required: [true, 'Please specify report type (daily or weekly)']
    },
    summary: {
        type: String,
        required: [true, 'Please provide a summary'],
        maxlength: [5000, 'Summary cannot exceed 5000 characters']
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    fileType: {
        type: String
    },
    fileKey: {
        type: String  // R2/S3 object key
    },
    fileSizeMB: {
        type: Number,
        default: 0
    },
    // State Machine: draft -> submitted -> under_review -> graded
    status: {
        type: String,
        enum: ['draft', 'submitted', 'under_review', 'graded'],
        default: 'draft'
    },
    // Admin assessment fields
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    marks: {
        type: Number,
        min: 0,
        max: 100
    },
    adminFeedback: {
        type: String,
        maxlength: [2000, 'Feedback cannot exceed 2000 characters']
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Timestamps
    submittedAt: {
        type: Date
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries - now scoped by organization
reportSchema.index({ organizationId: 1, intern: 1, status: 1 });
reportSchema.index({ organizationId: 1, status: 1, submittedAt: -1 });

// Virtual to check if undo is allowed
reportSchema.virtual('canUndo').get(function () {
    return this.status === 'submitted';
});

// Ensure virtuals are included in JSON
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);
