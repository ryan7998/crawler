const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db');
        console.log('✅ Connected to MongoDB');

        // Check if superadmin already exists
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('❌ Superadmin already exists:', existingSuperAdmin.email);
            process.exit(0);
        }

        // Create superadmin user
        const superAdminData = {
            email: 'admin@crawler.com',
            password: 'admin123456',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'superadmin'
        };

        const superAdmin = new User(superAdminData);
        await superAdmin.save();

        console.log('✅ Superadmin created successfully!');
        console.log('📧 Email:', superAdmin.email);
        console.log('⚠️  IMPORTANT: Change the default password immediately after first login!');

    } catch (error) {
        console.error('❌ Error creating superadmin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createSuperAdmin();
