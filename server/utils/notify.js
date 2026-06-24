const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('./email');

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

// Fire an email without blocking the request; respects the user's preference.
function emailIfEnabled(user, payload) {
    if (!user || user.emailNotifications === false || !user.email) return;
    sendNotificationEmail(user.email, user.name, payload).catch((err) =>
        console.error('Notification email failed:', err.message)
    );
}

/**
 * Notify a single user: in-app notification + (optional) email.
 */
async function notifyUser(recipientId, { organizationId, type, title, message, link, email = true }) {
    await createNotifications({ organizationId, recipient: recipientId, type, title, message, link });

    if (!email) return;
    try {
        const user = await User.findById(recipientId).select('name email emailNotifications');
        emailIfEnabled(user, { title, message, link });
    } catch (err) {
        console.error('notifyUser email lookup failed:', err.message);
    }
}

/**
 * Notify every active admin/owner in an organization: in-app + (optional) email.
 */
async function notifyOrgAdmins(organizationId, { excludeUserId, type, title, message, link, email = true }) {
    try {
        const admins = await User.find({
            organizationId,
            role: { $in: ['admin', 'owner'] },
            isActive: true
        }).select('name email emailNotifications');

        const recipients = admins.filter(
            (a) => !excludeUserId || a._id.toString() !== excludeUserId.toString()
        );

        await createNotifications(
            recipients.map((r) => ({ organizationId, recipient: r._id, type, title, message, link }))
        );

        if (email) {
            recipients.forEach((r) => emailIfEnabled(r, { title, message, link }));
        }
    } catch (err) {
        console.error('notifyOrgAdmins failed:', err.message);
    }
}

module.exports = { createNotifications, notifyUser, notifyOrgAdmins };
