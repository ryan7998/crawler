const mongoose = require('mongoose');
const Crawl = require('../models/Crawl');
require('dotenv').config();

async function migrateProxyUsage() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crawler');
        console.log('✅ Connected to MongoDB');

        // Find all crawl documents that don't have proxyUsageStats
        const crawlsToUpdate = await Crawl.find({
            $or: [
                { proxyUsageStats: { $exists: false } },
                { proxyUsageStats: null }
            ]
        });

        console.log(`📊 Found ${crawlsToUpdate.length} crawl documents to update`);

        if (crawlsToUpdate.length === 0) {
            console.log('✅ No migrations needed - all documents already have proxyUsageStats');
            return;
        }

        // Update each crawl document with default proxy usage stats
        const updatePromises = crawlsToUpdate.map(crawl => {
            return Crawl.updateOne(
                { _id: crawl._id },
                {
                    $set: {
                        proxyUsageStats: {
                            totalProxyRequests: 0,
                            uniqueProxiesUsed: 0,
                            lastProxyUsed: null,
                            proxyCostEstimate: 0,
                            averageProxySuccessRate: 0
                        }
                    }
                }
            );
        });

        await Promise.all(updatePromises);
        console.log('✅ Successfully updated all crawl documents with proxy usage stats');

        // Verify the migration
        const updatedCrawls = await Crawl.find({ 'proxyUsageStats.totalProxyRequests': { $exists: true } });
        console.log(`✅ Verification: ${updatedCrawls.length} documents now have proxyUsageStats`);

        // Show sample of updated documents
        if (updatedCrawls.length > 0) {
            console.log('\n📋 Sample updated document:');
            console.log(JSON.stringify(updatedCrawls[0].proxyUsageStats, null, 2));
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateProxyUsage()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = migrateProxyUsage; 