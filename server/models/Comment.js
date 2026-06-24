const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    body: {
        type: String,
        required: [true, 'Comment cannot be empty'],
        trim: true,
        maxlength: [2000, 'Comment cannot exceed 2000 characters']
    }
}, {
    timestamps: true
});

// Fetch a report's thread in chronological order
commentSchema.index({ report: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
