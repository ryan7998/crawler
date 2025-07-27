const mongoose = require('mongoose');
const Redis = require('ioredis');
require('dotenv').config();

// Import models
const Crawl = require('../models/Crawl');
const CrawlData = require('../models/CrawlData');
const ProxyUsage = require('../models/ProxyUsage');
const crawlQueue = require('../queues/getCrawlQueue');

// Configuration
const CONFIG = {
    // Database
    MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db',
    
    // Redis
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    
    // Options
    DRY_RUN: process.env.DRY_RUN === 'true', // Set to 'true' to preview without deleting
    CONFIRM_DELETION: process.env.CONFIRM_DELETION === 'true', // Set to 'true' to skip confirmation
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Logging utility
const log = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
};

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(CONFIG.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        log('info', 'Connected to MongoDB');
    } catch (error) {
        log('error', 'MongoDB connection failed:', error.message);
        throw error;
    }
};

// Get data statistics
const getDataStatistics = async () => {
    try {
        const [crawlCount, crawlDataCount, proxyUsageCount] = await Promise.all([
            Crawl.countDocuments(),
            CrawlData.countDocuments(),
            ProxyUsage.countDocuments()
        ]);

        return {
            crawls: crawlCount,
            crawlData: crawlDataCount,
            proxyUsage: proxyUsageCount
        };
    } catch (error) {
        log('error', 'Error getting data statistics:', error.message);
        throw error;
    }
};

// Clear all Redis queues
const clearAllQueues = async () => {
    try {
        const redis = new Redis({
            host: CONFIG.REDIS_HOST,
            port: CONFIG.REDIS_PORT,
        });

        // Get all queue keys that match the pattern 'bull:crawl:*'
        const keys = await redis.keys('bull:crawl:*');
        
        if (keys.length === 0) {
            log('info', 'No Redis queues found to clear');
            await redis.disconnect();
            return { clearedQueues: 0, totalJobsCleared: 0 };
        }

        let clearedQueues = 0;
        let totalJobsCleared = 0;

        for (const key of keys) {
            // Extract crawlId from the key (format: 'bull:crawl:crawlId')
            const parts = key.split(':');
            const crawlId = parts[2];
            
            if (!crawlId) continue;

            try {
                const queue = crawlQueue(crawlId);
                const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed', 'completed']);
                
                if (jobs.length > 0) {
                    if (!CONFIG.DRY_RUN) {
                        await queue.empty();
                    }
                    clearedQueues++;
                    totalJobsCleared += jobs.length;
                    log('info', `${CONFIG.DRY_RUN ? '[DRY RUN] Would clear' : 'Cleared'} ${jobs.length} jobs from queue for crawl ${crawlId}`);
                }

                await queue.close();
            } catch (err) {
                log('warn', `Error clearing queue for crawl ${crawlId}:`, err.message);
            }
        }

        await redis.disconnect();
        return { clearedQueues, totalJobsCleared };
    } catch (error) {
        log('error', 'Error clearing Redis queues:', error.message);
        throw error;
    }
};

// Clear all CrawlData
const clearAllCrawlDataDocuments = async () => {
    try {
        const count = await CrawlData.countDocuments();
        
        if (count === 0) {
            log('info', 'No CrawlData found to delete');
            return { deletedCount: 0 };
        }

        if (!CONFIG.DRY_RUN) {
            const result = await CrawlData.deleteMany({});
            log('info', `Deleted ${result.deletedCount} CrawlData documents`);
            return result;
        } else {
            log('info', `[DRY RUN] Would delete ${count} CrawlData documents`);
            return { deletedCount: count };
        }
    } catch (error) {
        log('error', 'Error deleting CrawlData:', error.message);
        throw error;
    }
};

// Clear all ProxyUsage data
const clearAllProxyUsage = async () => {
    try {
        const count = await ProxyUsage.countDocuments();
        
        if (count === 0) {
            log('info', 'No ProxyUsage data found to delete');
            return { deletedCount: 0 };
        }

        if (!CONFIG.DRY_RUN) {
            const result = await ProxyUsage.deleteMany({});
            log('info', `Deleted ${result.deletedCount} ProxyUsage documents`);
            return result;
        } else {
            log('info', `[DRY RUN] Would delete ${count} ProxyUsage documents`);
            return { deletedCount: count };
        }
    } catch (error) {
        log('error', 'Error deleting ProxyUsage data:', error.message);
        throw error;
    }
};

// Reset all Crawl documents to clean state
const resetAllCrawls = async () => {
    try {
        const count = await Crawl.countDocuments();
        
        if (count === 0) {
            log('info', 'No Crawl documents found to reset');
            return { updatedCount: 0 };
        }

        const updateData = {
            $set: {
                results: [],
                status: 'pending',
                startTime: null,
                endTime: null,
                error: '',
                logs: [],
                'proxyUsageStats.totalProxyRequests': 0,
                'proxyUsageStats.uniqueProxiesUsed': 0,
                'proxyUsageStats.lastProxyUsed': null,
                'proxyUsageStats.proxyCostEstimate': 0,
                'proxyUsageStats.averageProxySuccessRate': 0
            }
        };

        if (!CONFIG.DRY_RUN) {
            const result = await Crawl.updateMany({}, updateData);
            log('info', `Reset ${result.modifiedCount} Crawl documents to clean state`);
            return { updatedCount: result.modifiedCount };
        } else {
            log('info', `[DRY RUN] Would reset ${count} Crawl documents to clean state`);
            return { updatedCount: count };
        }
    } catch (error) {
        log('error', 'Error resetting Crawl documents:', error.message);
        throw error;
    }
};

// Main execution function
const clearAllCrawlData = async () => {
    const startTime = Date.now();
    
    try {
        log('info', '=== Starting Complete Crawl Data Cleanup ===');
        log('info', 'Configuration:', {
            dryRun: CONFIG.DRY_RUN,
            confirmDeletion: CONFIG.CONFIRM_DELETION,
            mongoUri: CONFIG.MONGO_URI,
            redisHost: CONFIG.REDIS_HOST,
            redisPort: CONFIG.REDIS_PORT
        });

        // Connect to database
        await connectDB();

        // Get initial statistics
        const initialStats = await getDataStatistics();
        log('info', 'Initial data statistics:', initialStats);

        // Confirmation prompt (unless DRY_RUN or CONFIRM_DELETION is set)
        if (!CONFIG.DRY_RUN && !CONFIG.CONFIRM_DELETION) {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise((resolve) => {
                rl.question(`\n⚠️  WARNING: This will permanently delete ALL crawl data!\n\n` +
                    `- ${initialStats.crawlData} CrawlData documents\n` +
                    `- ${initialStats.proxyUsage} ProxyUsage documents\n` +
                    `- All Redis queue jobs\n` +
                    `- Reset all Crawl documents to pending state\n\n` +
                    `Type 'YES' to confirm: `, resolve);
            });
            rl.close();

            if (answer !== 'YES') {
                log('info', 'Operation cancelled by user');
                return { success: false, message: 'Operation cancelled' };
            }
        }

        // Execute cleanup operations
        log('info', 'Starting cleanup operations...');

        // 1. Clear Redis queues
        log('info', '1. Clearing Redis queues...');
        const queueResults = await clearAllQueues();

        // 2. Clear CrawlData
        log('info', '2. Clearing CrawlData...');
        const crawlDataResults = await clearAllCrawlDataDocuments();

        // 3. Clear ProxyUsage
        log('info', '3. Clearing ProxyUsage data...');
        const proxyUsageResults = await clearAllProxyUsage();

        // 4. Reset Crawl documents
        log('info', '4. Resetting Crawl documents...');
        const crawlResetResults = await resetAllCrawls();

        // Final statistics
        const finalStats = await getDataStatistics();
        const executionTime = Date.now() - startTime;

        const summary = {
            success: true,
            executionTime: `${Math.round(executionTime / 1000)}s`,
            dryRun: CONFIG.DRY_RUN,
            operations: {
                queues: queueResults,
                crawlData: crawlDataResults,
                proxyUsage: proxyUsageResults,
                crawlReset: crawlResetResults
            },
            statistics: {
                before: initialStats,
                after: finalStats
            },
            timestamp: new Date().toISOString()
        };

        log('info', '=== Cleanup Operation Completed ===', summary);

        if (CONFIG.DRY_RUN) {
            log('info', '⚠️  This was a DRY RUN - no data was actually deleted');
        } else {
            log('info', '✅ All crawl data has been successfully cleared');
        }

        return summary;

    } catch (error) {
        log('error', 'Cleanup operation failed:', error.message);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            log('info', 'MongoDB connection closed');
        }
    }
};

// Handle script execution
if (require.main === module) {
    // Script is being run directly
    clearAllCrawlData()
        .then(result => {
            if (result.success) {
                log('info', 'Script completed successfully');
                process.exit(0);
            } else {
                log('error', 'Script failed');
                process.exit(1);
            }
        })
        .catch(error => {
            log('error', 'Unhandled error:', error.message);
            process.exit(1);
        });
}

module.exports = { clearAllCrawlData, CONFIG }; 