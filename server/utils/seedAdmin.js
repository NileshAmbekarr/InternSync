require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Admin users to be seeded
const adminUsers = [
    {
        name: 'Admin User',
        email: 'admin@internsync.com',
        password: 'admin123',
        role: 'admin',
        department: 'Management',
        isEmailVerified: true,
        isActive: true
    },
    {
        name: 'Test Admin',
        email: 'testadmin@internsync.com',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        isEmailVerified: true,
        isActive: true
    }
];

const seedAdmins = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log('🔄 Starting admin seed process...\n');

        let createdCount = 0;
        let skippedCount = 0;

        // Insert each admin user
        for (const adminData of adminUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ email: adminData.email });

            if (existingUser) {
                console.log(`⚠️  Admin already exists: ${adminData.email} (skipping)`);
                skippedCount++;
            } else {
                // Create new admin user
                const admin = await User.create(adminData);
                console.log(`✅ Created admin: ${admin.name} (${admin.email})`);
                createdCount++;
            }
        }

        console.log('\n📊 Seed Summary:');
        console.log(`   Created: ${createdCount} admin(s)`);
        console.log(`   Skipped: ${skippedCount} admin(s) (already exist)`);
        console.log('\n✨ Admin seed process completed successfully!');

        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error seeding admins:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Run the seed function
seedAdmins();
