const mongoose = require('mongoose');

/**
 * Database optimization utilities
 * Provides functions to create indexes and optimize queries
 */

/**
 * Create indexes for better query performance
 */
const createIndexes = async () => {
    try {
        console.log('🔧 Creating database indexes...');

        // User model indexes
        await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
        await mongoose.connection.db.collection('users').createIndex({ role: 1 });
        await mongoose.connection.db.collection('users').createIndex({ isActive: 1 });

        // Crawl model indexes
        await mongoose.connection.db.collection('crawls').createIndex({ userId: 1 });
        await mongoose.connection.db.collection('crawls').createIndex({ status: 1 });
        await mongoose.connection.db.collection('crawls').createIndex({ createdAt: -1 });
        await mongoose.connection.db.collection('crawls').createIndex({ title: 'text' }); // Text search
        await mongoose.connection.db.collection('crawls').createIndex({ userId: 1, status: 1 }); // Compound index

        // CrawlData model indexes
        await mongoose.connection.db.collection('crawldatas').createIndex({ crawlId: 1 });
        await mongoose.connection.db.collection('crawldatas').createIndex({ url: 1 });
        await mongoose.connection.db.collection('crawldatas').createIndex({ crawlId: 1, url: 1 }); // Compound index
        await mongoose.connection.db.collection('crawldatas').createIndex({ createdAt: -1 });

        // ProxyUsage model indexes
        await mongoose.connection.db.collection('proxyusages').createIndex({ crawlId: 1 });
        await mongoose.connection.db.collection('proxyusages').createIndex({ proxyId: 1 });
        await mongoose.connection.db.collection('proxyusages').createIndex({ url: 1 });
        await mongoose.connection.db.collection('proxyusages').createIndex({ lastUsed: -1 });
        await mongoose.connection.db.collection('proxyusages').createIndex({ crawlId: 1, proxyId: 1 }); // Compound index
        await mongoose.connection.db.collection('proxyusages').createIndex({ url: 1, proxyId: 1 }); // Compound index

        // Selectors model indexes
        await mongoose.connection.db.collection('selectors').createIndex({ domain: 1 }, { unique: true });

        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating database indexes:', error.message);
        throw error;
    }
};

/**
 * Analyze query performance
 * @param {string} collection - Collection name
 * @param {Object} query - Query object
 */
const analyzeQuery = async (collection, query) => {
    try {
        const result = await mongoose.connection.db.collection(collection).explain('executionStats').find(query);
        return result;
    } catch (error) {
        console.error('Error analyzing query:', error.message);
        return null;
    }
};

/**
 * Get collection statistics
 * @param {string} collectionName - Collection name
 */
const getCollectionStats = async (collectionName) => {
    try {
        const stats = await mongoose.connection.db.collection(collectionName).stats();
        return {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            storageSize: stats.storageSize,
            totalIndexSize: stats.totalIndexSize,
            indexSizes: stats.indexSizes
        };
    } catch (error) {
        console.error('Error getting collection stats:', error.message);
        return null;
    }
};

/**
 * Clean up old data
 * @param {string} collectionName - Collection name
 * @param {Object} filter - Filter for old data
 * @param {number} daysOld - Days old threshold
 */
const cleanupOldData = async (collectionName, filter, daysOld = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await mongoose.connection.db.collection(collectionName).deleteMany({
            ...filter,
            createdAt: { $lt: cutoffDate }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old records from ${collectionName}`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up old data:', error.message);
        return 0;
    }
};

/**
 * Optimize database performance
 */
const optimizeDatabase = async () => {
    try {
        console.log('🚀 Starting database optimization...');

        // Create indexes
        await createIndexes();

        // Clean up old data
        await cleanupOldData('crawldatas', {}, 180); // Keep crawl data for 6 months
        await cleanupOldData('proxyusages', {}, 90); // Keep proxy usage for 3 months

        console.log('✅ Database optimization completed');
    } catch (error) {
        console.error('❌ Database optimization failed:', error.message);
        throw error;
    }
};

module.exports = {
    createIndexes,
    analyzeQuery,
    getCollectionStats,
    cleanupOldData,
    optimizeDatabase
};
