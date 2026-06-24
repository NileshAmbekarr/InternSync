/**
 * Email digest job.
 *
 * Groups all not-yet-digested notifications by recipient and emails each user
 * (who has email notifications enabled) a summary of their recent activity,
 * then marks those notifications as digested so they aren't sent again.
 *
 * Run manually:   node scripts/sendDigest.js
 * Schedule daily: e.g. cron `0 8 * * *  cd /path/to/server && node scripts/sendDigest.js`
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendDigestEmail } = require('../utils/email');

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Digest: connected to MongoDB');

    // Group pending notifications by recipient
    const grouped = await Notification.aggregate([
        { $match: { digested: false } },
        { $sort: { createdAt: -1 } },
        {
            $group: {
                _id: '$recipient',
                notifications: { $push: { title: '$title', message: '$message' } },
                ids: { $push: '$_id' }
            }
        }
    ]);

    let sent = 0;
    for (const group of grouped) {
        const user = await User.findById(group._id).select('name email emailNotifications');
        if (user && user.emailNotifications !== false && user.email) {
            const ok = await sendDigestEmail(user.email, user.name, group.notifications);
            if (ok) sent++;
        }
        // Mark as digested regardless of send outcome to avoid unbounded retries
        await Notification.updateMany({ _id: { $in: group.ids } }, { digested: true });
    }

    console.log(`Digest: processed ${grouped.length} recipient(s), emailed ${sent}.`);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Digest job failed:', err);
    process.exit(1);
});
