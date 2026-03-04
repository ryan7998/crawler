const mongoose = require('mongoose');
const Crawl = require('./src/models/Crawl');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestCrawl() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db');
        console.log('✅ Connected to MongoDB');

        // Find or create a test user
        let user = await User.findOne({ email: 'admin@crawler.com' });
        if (!user) {
            console.log('❌ No admin user found. Please run: npm run create-superadmin');
            process.exit(1);
        }

        // Check if test crawl already exists
        const existingCrawl = await Crawl.findOne({ title: 'Test Crawl' });
        if (existingCrawl) {
            console.log('✅ Test crawl already exists:', existingCrawl._id);
            process.exit(0);
        }

        // Create test crawl
        const testCrawl = new Crawl({
            title: 'Test Crawl',
            urls: ['https://example.com', 'https://httpbin.org/get'],
            selectors: [
                { name: 'title', selector: 'title' },
                { name: 'description', selector: 'meta[name="description"]' }
            ],
            userId: user._id,
            status: 'pending'
        });

        await testCrawl.save();
        console.log('✅ Test crawl created successfully!');
        console.log('📋 Crawl ID:', testCrawl._id);
        console.log('🌐 URLs:', testCrawl.urls);
        console.log('🔍 Selectors:', testCrawl.selectors);

    } catch (error) {
        console.error('❌ Error creating test crawl:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createTestCrawl();
