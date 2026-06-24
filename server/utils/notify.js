const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create one or more notifications without throwing into the caller's flow.
 * Notification delivery is best-effort: a failure here must never break the
 * primary action (submitting/grading a report, accepting an invite, etc.).
 */
async function createNotifications(notifications) {
    try {
        const docs = Array.isArray(notifications) ? notifications : [notifications];
        if (docs.length === 0) return;
        await Notification.insertMany(docs);
    } catch (err) {
        console.error('Notification create failed:', err.message);
    }
}

/**
 * Notify every active admin/owner in an organization (e.g. a new submission).
 */
async function notifyOrgAdmins(organizationId, { excludeUserId, type, title, message, link }) {
    try {
        const admins = await User.find({
            organizationId,
            role: { $in: ['admin', 'owner'] },
            isActive: true
        }).select('_id');

        const recipients = admins
            .map((a) => a._id)
            .filter((id) => !excludeUserId || id.toString() !== excludeUserId.toString());

        await createNotifications(
            recipients.map((recipient) => ({
                organizationId,
                recipient,
                type,
                title,
                message,
                link
            }))
        );
    } catch (err) {
        console.error('notifyOrgAdmins failed:', err.message);
    }
}

module.exports = { createNotifications, notifyOrgAdmins };
