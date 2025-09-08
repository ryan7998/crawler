const mongoose = require('mongoose');
const Crawl = require('../models/Crawl');
require('dotenv').config();

async function migrateCreatedAt() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crawler');
        console.log('✅ Connected to MongoDB');

        // Find all crawl documents that don't have createdAt field
        const crawlsToUpdate = await Crawl.find({
            $or: [
                { createdAt: { $exists: false } },
                { createdAt: null }
            ]
        });

        console.log(`📊 Found ${crawlsToUpdate.length} crawl documents to update`);

        if (crawlsToUpdate.length === 0) {
            console.log('✅ No migrations needed - all documents already have createdAt');
            return;
        }

        // Update each crawl document with createdAt field
        const updatePromises = crawlsToUpdate.map(crawl => {
            // Use startTime as createdAt if available, otherwise use current date
            const createdAt = crawl.startTime || new Date();
            
            return Crawl.updateOne(
                { _id: crawl._id },
                {
                    $set: {
                        createdAt: createdAt
                    }
                }
            );
        });

        await Promise.all(updatePromises);
        console.log('✅ Successfully updated all crawl documents with createdAt field');

        // Verify the migration
        const updatedCrawls = await Crawl.find({ createdAt: { $exists: true } });
        console.log(`✅ Verification: ${updatedCrawls.length} documents now have createdAt`);

        // Show sample of updated documents
        if (updatedCrawls.length > 0) {
            console.log('\n📋 Sample updated document:');
            const sample = updatedCrawls[0];
            console.log(`   - ID: ${sample._id}`);
            console.log(`   - Title: ${sample.title}`);
            console.log(`   - Created At: ${sample.createdAt}`);
            console.log(`   - Start Time: ${sample.startTime}`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateCreatedAt()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateCreatedAt;
