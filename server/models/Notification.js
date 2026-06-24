const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['report_submitted', 'report_reviewed', 'report_graded', 'invite_accepted', 'report_comment'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    read: {
        type: Boolean,
        default: false
    },
    // Whether this notification has been included in a digest email
    digested: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hot path: fetch a recipient's notifications newest-first, count unread
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
