const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Import services
const googleSheetsService = require('../services/googleSheetsOAuth2Service');
const Crawl = require('../models/Crawl');
const CrawlData = require('../models/CrawlData');

// Configuration
const CONFIG = {
    // API endpoints
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    WORKER_URL: process.env.WORKER_URL || 'http://localhost:3002',
    
    // Crawl settings
    MAX_WAIT_TIME: 30 * 60 * 1000, // 30 minutes max wait time
    CHECK_INTERVAL: 10 * 1000, // Check every 10 seconds
    MAX_CONCURRENT_CRAWLS: 10, // Limit concurrent crawls
    
    // Export settings
    EXPORT_TO_GOOGLE_SHEETS: process.env.EXPORT_TO_GOOGLE_SHEETS !== 'false',
    INCLUDE_UNCHANGED: process.env.INCLUDE_UNCHANGED === 'true',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    LOG_FILE: process.env.LOG_FILE || null
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
    
    // TODO: Add file logging if LOG_FILE is configured
};

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        log('info', 'Connected to MongoDB');
    } catch (error) {
        log('error', 'MongoDB connection failed:', error.message);
        throw error;
    }
};

// Get all enabled crawls
const getEnabledCrawls = async () => {
    try {
        const crawls = await Crawl.find({ disabled: { $ne: true } })
            .sort({ createdAt: -1 });
        
        log('info', `Found ${crawls.length} enabled crawls`);
        return crawls;
    } catch (error) {
        log('error', 'Error fetching enabled crawls:', error.message);
        throw error;
    }
};

// Start a single crawl
const startCrawl = async (crawl) => {
    try {
        log('info', `Starting crawl: ${crawl.title} (${crawl._id})`);
        
        const response = await axios.post(`${CONFIG.API_BASE_URL}/api/startcrawl`, {
            urls: crawl.urls,
            crawlId: crawl._id,
            selectors: crawl.selectors
        });
        
        log('info', `Crawl started successfully: ${crawl.title}`, response.data);
        return { success: true, crawlId: crawl._id, title: crawl.title };
    } catch (error) {
        log('error', `Failed to start crawl ${crawl.title}:`, error.message);
        return { success: false, crawlId: crawl._id, title: crawl.title, error: error.message };
    }
};

// Start all crawls with concurrency control
const startAllCrawls = async (crawls) => {
    const results = {
        started: [],
        failed: [],
        skipped: []
    };
    
    // Process crawls in batches to control concurrency
    for (let i = 0; i < crawls.length; i += CONFIG.MAX_CONCURRENT_CRAWLS) {
        const batch = crawls.slice(i, i + CONFIG.MAX_CONCURRENT_CRAWLS);
        
        log('info', `Processing batch ${Math.floor(i / CONFIG.MAX_CONCURRENT_CRAWLS) + 1}/${Math.ceil(crawls.length / CONFIG.MAX_CONCURRENT_CRAWLS)}`);
        
        const batchPromises = batch.map(async (crawl) => {
            // Check if crawl is already in progress
            if (crawl.status === 'in-progress') {
                log('warn', `Crawl ${crawl.title} is already in progress, skipping`);
                results.skipped.push({ crawlId: crawl._id, title: crawl.title, reason: 'already in progress' });
                return;
            }
            
            const result = await startCrawl(crawl);
            if (result.success) {
                results.started.push(result);
            } else {
                results.failed.push(result);
            }
        });
        
        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (i + CONFIG.MAX_CONCURRENT_CRAWLS < crawls.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return results;
};

// Check if all crawls are completed
const checkCrawlStatus = async (crawlIds) => {
    try {
        const crawls = await Crawl.find({ _id: { $in: crawlIds } });
        const statusCounts = {
            'in-progress': 0,
            'completed': 0,
            'failed': 0,
            'pending': 0
        };
        
        crawls.forEach(crawl => {
            statusCounts[crawl.status] = (statusCounts[crawl.status] || 0) + 1;
        });
        
        const allCompleted = statusCounts['in-progress'] === 0 && statusCounts['pending'] === 0;
        
        log('info', 'Crawl status:', statusCounts);
        
        return {
            allCompleted,
            statusCounts,
            crawls
        };
    } catch (error) {
        log('error', 'Error checking crawl status:', error.message);
        throw error;
    }
};

// Wait for all crawls to complete
const waitForCrawlsToComplete = async (crawlIds) => {
    const startTime = Date.now();
    
    log('info', `Waiting for ${crawlIds.length} crawls to complete...`);
    
    while (Date.now() - startTime < CONFIG.MAX_WAIT_TIME) {
        const status = await checkCrawlStatus(crawlIds);
        
        if (status.allCompleted) {
            log('info', 'All crawls completed successfully!');
            return status;
        }
        
        log('info', `Waiting... ${status.statusCounts['in-progress']} still in progress`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.CHECK_INTERVAL));
    }
    
    log('warn', 'Timeout reached while waiting for crawls to complete');
    return await checkCrawlStatus(crawlIds);
};

// Mark in-progress crawls as failed
const markInProgressCrawlsAsFailed = async (crawlIds) => {
    try {
        const result = await Crawl.updateMany(
            { 
                _id: { $in: crawlIds },
                status: 'in-progress'
            },
            { 
                $set: { 
                    status: 'failed',
                    error: 'Crawl timed out or was interrupted during global execution',
                    endTime: new Date()
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            log('warn', `Marked ${result.modifiedCount} in-progress crawls as failed`);
        } else {
            log('info', 'No in-progress crawls found to mark as failed');
        }
        
        return result.modifiedCount;
    } catch (error) {
        log('error', 'Error marking in-progress crawls as failed:', error.message);
        throw error;
    }
};

// Export to Google Sheets
const exportToGoogleSheets = async () => {
    if (!CONFIG.EXPORT_TO_GOOGLE_SHEETS) {
        log('info', 'Google Sheets export disabled, skipping');
        return null;
    }
    
    try {
        log('info', 'Starting Google Sheets export...');
        
        const result = await googleSheetsService.exportGlobalChanges({
            includeUnchanged: CONFIG.INCLUDE_UNCHANGED,
            sheetTitle: `Global Crawl Changes - ${new Date().toISOString().split('T')[0]}`,
            limit: 100
        });
        
        if (result.error) {
            log('error', 'Google Sheets export failed:', result.error);
            return result;
        }
        
        log('info', 'Google Sheets export completed successfully', {
            spreadsheetId: result.spreadsheetId,
            sheetUrl: result.sheetUrl,
            rowCount: result.rowCount
        });
        
        return result;
    } catch (error) {
        log('error', 'Google Sheets export error:', error.message);
        return { error: error.message };
    }
};

// Main execution function
const runGlobalCrawls = async () => {
    const startTime = Date.now();
    
    try {
        log('info', '=== Starting Global Crawl Execution ===');
        log('info', 'Configuration:', CONFIG);
        
        // Connect to database
        await connectDB();
        
        // Get enabled crawls
        const crawls = await getEnabledCrawls();
        
        if (crawls.length === 0) {
            log('warn', 'No enabled crawls found');
            return { success: true, message: 'No crawls to run' };
        }
        
        // Start all crawls
        const startResults = await startAllCrawls(crawls);
        
        log('info', 'Crawl start results:', {
            started: startResults.started.length,
            failed: startResults.failed.length,
            skipped: startResults.skipped.length
        });
        
        if (startResults.failed.length > 0) {
            log('warn', 'Some crawls failed to start:', startResults.failed);
        }
        
        if (startResults.started.length === 0) {
            log('warn', 'No crawls were started');
            return { success: true, message: 'No crawls were started' };
        }
        
        // Wait for crawls to complete
        const startedCrawlIds = startResults.started.map(r => r.crawlId);
        const completionStatus = await waitForCrawlsToComplete(startedCrawlIds);
        
        // Mark any remaining in-progress crawls as failed
        const failedCount = await markInProgressCrawlsAsFailed(startedCrawlIds);
        
        // Export to Google Sheets
        const exportResult = await exportToGoogleSheets();
        
        // Final summary
        const executionTime = Date.now() - startTime;
        const summary = {
            success: true,
            executionTime: `${Math.round(executionTime / 1000)}s`,
            crawlsStarted: startResults.started.length,
            crawlsFailed: startResults.failed.length,
            crawlsSkipped: startResults.skipped.length,
            crawlsMarkedAsFailed: failedCount,
            finalStatus: completionStatus.statusCounts,
            googleSheetsExport: exportResult,
            timestamp: new Date().toISOString()
        };
        
        log('info', '=== Global Crawl Execution Completed ===', summary);
        
        return summary;
        
    } catch (error) {
        log('error', 'Global crawl execution failed:', error.message);
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
    runGlobalCrawls()
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

module.exports = { runGlobalCrawls, CONFIG }; 