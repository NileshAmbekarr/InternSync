require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Admin user details - CHANGE THESE VALUES
        const adminData = {
            name: 'Admin User',
            email: 'admin@internsync.com',
            password: 'admin123', // This will be automatically hashed
            role: 'admin',
            department: 'Management',
            isEmailVerified: true,
            isActive: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('❌ Admin already exists with this email');
            process.exit(1);
        }

        // Create admin user (password will be hashed automatically by pre-save hook)
        const admin = await User.create(adminData);

        console.log('\n✅ Admin user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:      ${admin.email}`);
        console.log(`👤 Name:       ${admin.name}`);
        console.log(`🔑 Password:   ${adminData.password} (stored as hash)`);
        console.log(`🏢 Department: ${admin.department}`);
        console.log(`🎯 Role:       ${admin.role}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('ℹ️  You can now login with:');
        console.log(`   Email:    ${admin.email}`);
        console.log(`   Password: ${adminData.password}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();
