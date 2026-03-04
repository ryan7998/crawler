const mongoose = require('mongoose');

/**
 * Database diagnostic and maintenance utilities.
 * All indexes are declared directly in the model schemas — no manual index creation here.
 */

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
 * Optimize database performance (cleanup old data)
 */
const optimizeDatabase = async () => {
    try {
        console.log('🚀 Starting database optimization...');
        await cleanupOldData('crawldatas', {}, 180); // Keep crawl data for 6 months
        await cleanupOldData('proxyusages', {}, 90); // Keep proxy usage for 3 months
        console.log('✅ Database optimization completed');
    } catch (error) {
        console.error('❌ Database optimization failed:', error.message);
        throw error;
    }
};

module.exports = {
    analyzeQuery,
    getCollectionStats,
    cleanupOldData,
    optimizeDatabase
};
