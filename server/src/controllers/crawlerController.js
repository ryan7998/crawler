const axios = require('axios')
// const crawlQueue = require('../queues/crawlQueue')
const crawlQueue = require('../queues/getCrawlQueue')
const Crawl = require('../models/Crawl')
const CrawlData = require('../models/CrawlData')
const Selectors = require('../models/Selectors')
const { aggregateDashboard, extractHtml } = require('../../utils/helperFunctions')
const { default: mongoose, isObjectIdOrHexString } = require('mongoose')
const proxyUsageService = require('../services/proxyUsageService')

const crawlWebsite = async (req, res) => {
    const { urls, crawlId, selectors } = req.body

    try {
        // Check if crawl is already in progress
        const existingCrawl = await Crawl.findById(crawlId)
        if (!existingCrawl) {
            return res.status(404).json({ message: 'Crawl not found' })
        }
        
        if (existingCrawl.status === 'in-progress') {
            return res.status(400).json({ message: 'Crawl is already in progress' })
        }

        // Update crawl status to in-progress
        await Crawl.findByIdAndUpdate(crawlId, { status: 'in-progress' })

        console.log("Adding job: ", urls, crawlId)
        // 1) Tell the worker "set up a processor for this crawlId"
        try {
            await axios.post(`http://localhost:3002/processor/${crawlId}`);
        } catch (err) {
            console.error('Failed to notify worker to start processor:', err.message);
            // you can choose to continue or return an error here
        }
        const q = crawlQueue(crawlId)

        // Check if jobs already exist for this crawl
        const existingJobs = await q.getJobs(['waiting', 'active', 'delayed'])
        if (existingJobs.length > 0) {
            console.log(`Found ${existingJobs.length} existing jobs for crawl ${crawlId}, skipping job addition`);
            return res.json({ message: 'Crawl jobs already exist in queue', urls })
        }

        // Generate a unique runId for this crawl run
        const runId = Date.now().toString();

        for (const url of urls) {
            await q.add({ url, crawlId, runId })
        }
        res.json({ message: 'Crawl jobs added to queue', urls })
    } catch (error) {
        console.log('Error adding jobs to the queue: ', error.message)
        res.status(500).json({ error: `Failed to add crawl jobs. ${error.message}` })
    }
}

const createCrawler = async (req, res) => {
    const { title, urls, selectors, userId, advancedSelectors } = req.body

    try {
        // Create new crawl entry
        const newCrawl = new Crawl({
            title,
            urls: urls.map(url => url.trim()), // Convert to array of strings
            selectors: selectors || [], // Use provided selectors or empty array
            advancedSelectors: advancedSelectors || [],
            userId,
            status: 'pending',
        })
        console.log('newCrawl: ', newCrawl)
        // Save to database
        await newCrawl.save()
        res.status(201).json({ message: 'Crawl created', crawlId: newCrawl._id })
    } catch (error) {
        res.status(500).json({ message: 'Error creating crawl', error: error.message })
    }
}

const updateCrawler = async (req, res) => {
    const { id } = req.params
    const { title, urls, selectors, advancedSelectors } = req.body

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }
    try {
        // Find the existing crawl
        const crawl = await Crawl.findById(id)
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' })
        }
        // Update the crawl fields if provided
        if (title) crawl.title = title
        if (urls) crawl.urls = urls.map(url => url.trim())
        if (selectors) crawl.selectors = selectors
        if (advancedSelectors) crawl.advancedSelectors = advancedSelectors
        if (typeof req.body.disabled === 'boolean') crawl.disabled = req.body.disabled

        const updatedCrawl = await crawl.save()
        res.status(200).json({ message: 'Crawl updated successfully', crawl: updatedCrawl })
    } catch (error) {
        console.log('Error updating crawl: ', error.message)
        res.status(500).json({ message: 'Error updating crawl', error: error.message })
    }
}

const deleteCrawler = async (req, res) => {
    const { id } = req.params

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }
    try {
        // Find existing crawl
        const crawl = await Crawl.findById(id)
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' })
        }
        // Remove associated CrawlData entries
        await CrawlData.deleteMany({ crawlId: id })
        
        // Remove jobs related to this crawl from the queue
        console.log('deleting jobs for crawl:', id)
        const q = crawlQueue(id)
        const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
        console.log(`Found ${jobs.length} jobs to delete`)
        
        for (const job of jobs) {
            console.log('Deleting job:', job.id)
            await job.remove()
        }
        console.log('Finished deleting jobs')
        
        // Delete the crawl document
        await Crawl.findByIdAndDelete(id)
        // Emit a socket event to notify clients about the deletion
        // io.emit('crawlDeleted', { crawlId: id })
        res.status(200).json({ message: 'Crawl deleted successfully' })
    } catch (error) {
        console.error('Error deleting crawl:', error.message);
        res.status(500).json({ message: 'Error deleting crawl', error: error.message });
    }
}

const getCrawler = async (req, res) => {
    const { id } = req.params

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }
    try {
        // Find the crawl by its ObjectId
        const crawlerData = await Crawl.findById(id)
            .select('-__v')
            .populate({
                path: 'results',
                select: '-__v'
            })

        // If the crawl doesn't exist, return a 404
        if (!crawlerData) {
            return res.status(404).json({ message: 'Crawler not found' })
        }

        const aggregatedData = aggregateDashboard(crawlerData)
        const aggregatedCrawlObj = crawlerData.toObject()
        if (aggregatedData) {
            aggregatedCrawlObj.aggregatedData = aggregatedData
            // Return the found crawl data
        }
        res.status(200).json(aggregatedCrawlObj)
    } catch (error) {
        // Handle invalid ObjectId errors or other server issues
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid crawl ID' })
        }
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

const getAllCrawlers = async (req, res) => {

    try {
        // Build the query
        let query = {}
        
        // Add search functionality
        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' } // Case-insensitive search
        }
        
        // Implement pagination
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 100
        const skip = (page - 1) * limit

        // Fetch crawls from the database
        const crawls = await Crawl.find(query)
            .select('-__v') // Exclude the __v field
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const totalCrawls = await Crawl.countDocuments(query)

        res.status(200).json({
            page,
            totalPages: Math.ceil(totalCrawls / limit),
            crawls,
            totalCrawls
        })
    } catch (error) {
        console.error('Error fetching all crawls: ', error.message)
        res.status(500).json({ message: 'Error fetching crawls, ', error: error.message })
    }

}

const checkDomainSelectors = async (req, res) => {
    const { domain } = req.params
    console.log('domain: ', domain)

    try {
        // Find selectors for the domain
        const domainSelectors = await Selectors.findOne({ domain })

        if (!domainSelectors) {
            return res.status(404).json({
                message: 'No selectors found for this domain',
                hasSelectors: false
            })
        }

        res.status(200).json({
            message: 'Selectors found for this domain',
            hasSelectors: true,
            selectors: domainSelectors.selectors
        })
    } catch (error) {
        console.error('Error checking domain selectors:', error.message)
        res.status(500).json({
            message: 'Error checking domain selectors',
            error: error.message
        })
    }
}

const getQueueStatus = async (req, res) => {
    try {
        const { crawlId } = req.params
        const q = crawlQueue(crawlId)
        const jobs = await q.getJobs(['active', 'waiting', 'delayed'])
        res.json({
            active: jobs.filter(job => job.status === 'active').length,
            waiting: jobs.filter(job => job.status === 'waiting').length,
            delayed: jobs.filter(job => job.status === 'delayed').length,
            total: jobs.length
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

const deleteCrawlData = async (req, res) => {
    const { id } = req.params

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }
    
    try {
        // Find existing crawl
        const crawl = await Crawl.findById(id)
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' })
        }

        // Get count of CrawlData entries before deletion
        const dataCount = await CrawlData.countDocuments({ crawlId: id })
        
        // Remove associated CrawlData entries
        const deleteResult = await CrawlData.deleteMany({ crawlId: id })
        
        // Clear the results array in the Crawl document
        await Crawl.findByIdAndUpdate(id, { 
            $set: { 
                results: [],
                status: 'pending',
                startTime: null,
                endTime: null
            }
        })

        // Remove any pending jobs for this crawl from the queue
        const q = crawlQueue(id)
        const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            await job.remove()
            removedJobsCount++
        }

        console.log(`Deleted ${deleteResult.deletedCount} crawl data entries and ${removedJobsCount} queue jobs for crawl ${id}`)
        
        res.status(200).json({ 
            message: 'Crawl data deleted successfully',
            deletedDataCount: deleteResult.deletedCount,
            deletedJobsCount: removedJobsCount,
            crawlId: id
        })
        
    } catch (error) {
        console.error('Error deleting crawl data:', error.message);
        res.status(500).json({ message: 'Error deleting crawl data', error: error.message });
    }
}

const deleteCrawlDataForUrls = async (req, res) => {
    const { id } = req.params
    const { urls } = req.body

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }

    // Validate URLs array
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: 'URLs array is required and must not be empty' })
    }
    
    try {
        // Find existing crawl
        const crawl = await Crawl.findById(id)
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' })
        }

        // Remove CrawlData entries for specific URLs
        const deleteResult = await CrawlData.deleteMany({ 
            crawlId: id,
            url: { $in: urls }
        })

        // Remove queue jobs for specific URLs
        const q = crawlQueue(id)
        const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            if (urls.includes(job.data.url)) {
                await job.remove()
                removedJobsCount++
            }
        }

        // Update crawl status if all data is deleted
        const remainingDataCount = await CrawlData.countDocuments({ crawlId: id })
        if (remainingDataCount === 0) {
            await Crawl.findByIdAndUpdate(id, { 
                $set: { 
                    results: [],
                    status: 'pending',
                    startTime: null,
                    endTime: null
                }
            })
        }

        console.log(`Deleted ${deleteResult.deletedCount} crawl data entries and ${removedJobsCount} queue jobs for specific URLs in crawl ${id}`)
        
        res.status(200).json({ 
            message: 'Crawl data for specific URLs deleted successfully',
            deletedDataCount: deleteResult.deletedCount,
            deletedJobsCount: removedJobsCount,
            remainingDataCount,
            crawlId: id,
            deletedUrls: urls
        })
        
    } catch (error) {
        console.error('Error deleting crawl data for specific URLs:', error.message);
        res.status(500).json({ message: 'Error deleting crawl data for specific URLs', error: error.message });
    }
}

// GLOBAL RUN: Start all non-disabled crawls
const runAllCrawls = async (req, res) => {
    try {
        // Find all non-disabled crawls
        const crawls = await Crawl.find({ disabled: { $ne: true } });
        if (!crawls.length) {
            return res.status(200).json({ message: 'No non-disabled crawls found to start', started: [], skipped: [] });
        }
        const started = [];
        const skipped = [];
        for (const crawl of crawls) {
            // Defensive: check again if status is in-progress (in case of race)
            if (crawl.status === 'in-progress') {
                skipped.push({ crawlId: crawl._id, title: crawl.title, reason: 'already in progress' });
                continue;
            }
            // Use crawlWebsite logic directly
            try {
                // Use the same logic as crawlWebsite, but call the function directly
                await crawlWebsite({
                    body: {
                        urls: crawl.urls,
                        crawlId: crawl._id,
                        selectors: crawl.selectors
                    }
                }, {
                    json: (result) => {
                        // Optionally collect result
                    },
                    status: () => ({ json: () => {} }) // Dummy for error path
                });
                started.push({ crawlId: crawl._id, title: crawl.title });
            } catch (err) {
                skipped.push({ crawlId: crawl._id, title: crawl.title, reason: err.message });
            }
        }
        res.status(200).json({ message: `Started ${started.length} crawls`, started, skipped });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start all crawls', error: error.message });
    }
};

// Clear the queue for a specific crawl
const clearCrawlQueue = async (req, res) => {
    const { crawlId } = req.params;
    try {
        const q = crawlQueue(crawlId);
        await q.empty();
        res.status(200).json({ message: `Queue for crawl ${crawlId} cleared!` });
    } catch (err) {
        console.error('Error clearing queue:', err);
        res.status(500).json({ message: 'Error clearing queue', error: err.message });
    }
};

// Clear all queues
const clearAllQueues = async (req, res) => {
    try {
        const Redis = require('ioredis')
        const redis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
        })

        // Get all queue keys that match the pattern 'bull:crawl:*'
        const keys = await redis.keys('bull:crawl:*')
        
        if (keys.length === 0) {
            await redis.disconnect()
            return res.status(200).json({ message: 'No queues found to clear' });
        }

        let clearedQueues = 0;
        let totalJobsCleared = 0;

        for (const key of keys) {
            // Extract crawlId from the key (format: 'bull:crawl:crawlId')
            const parts = key.split(':')
            const crawlId = parts[2]
            
            if (!crawlId) continue

            try {
                const queue = crawlQueue(crawlId)
                const jobs = await queue.getJobs(['waiting', 'active', 'delayed', 'failed'])
                
                if (jobs.length > 0) {
                    await queue.empty()
                    clearedQueues++
                    totalJobsCleared += jobs.length
                    console.log(`Cleared ${jobs.length} jobs from queue for crawl ${crawlId}`)
                }

                await queue.close()
            } catch (err) {
                console.log(`Error clearing queue for crawl ${crawlId}:`, err.message)
            }
        }

        await redis.disconnect()

        res.status(200).json({ 
            message: `Cleared ${clearedQueues} queues with ${totalJobsCleared} total jobs`,
            clearedQueues,
            totalJobsCleared
        });

    } catch (error) {
        console.error('Error clearing all queues:', error.message)
        res.status(500).json({ message: 'Error clearing all queues', error: error.message })
    }
};

// Get status of all per-crawl queues
const getAllQueuesStatus = async (req, res) => {
    try {
        const Redis = require('ioredis')
        const redis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
        })

        // Get all queue keys that match the pattern 'bull:crawl:*'
        const keys = await redis.keys('bull:crawl:*')
        
        if (keys.length === 0) {
            await redis.disconnect()
            return res.json({ 
                queues: [],
                summary: {
                    totalActive: 0,
                    totalWaiting: 0,
                    totalDelayed: 0,
                    totalFailed: 0,
                    totalCompleted: 0
                }
            })
        }

        let totalActive = 0
        let totalWaiting = 0
        let totalDelayed = 0
        let totalFailed = 0
        let totalCompleted = 0
        const queues = []

        for (const key of keys) {
            // Extract crawlId from the key (format: 'bull:crawl:crawlId')
            const parts = key.split(':')
            const crawlId = parts[2]
            
            if (!crawlId) continue

            try {
                const queue = crawlQueue(crawlId) // Use the existing crawlQueue function
                const waiting = await queue.getJobs(['waiting'])
                const active = await queue.getJobs(['active'])
                const delayed = await queue.getJobs(['delayed'])
                const failed = await queue.getJobs(['failed'])
                const completed = await queue.getJobs(['completed'])

                const total = waiting.length + active.length + delayed.length + failed.length + completed.length
                
                if (total > 0) {
                    const queueInfo = {
                        crawlId,
                        total,
                        waiting: waiting.length,
                        active: active.length,
                        delayed: delayed.length,
                        failed: failed.length,
                        completed: completed.length,
                        activeJobs: active.map(job => ({
                            id: job.id,
                            url: job.data.url
                        }))
                    }
                    queues.push(queueInfo)

                    totalActive += active.length
                    totalWaiting += waiting.length
                    totalDelayed += delayed.length
                    totalFailed += failed.length
                    totalCompleted += completed.length
                }

                await queue.close()
            } catch (err) {
                console.log(`Error checking queue for crawl ${crawlId}:`, err.message)
            }
        }

        await redis.disconnect()

        res.json({
            queues,
            summary: {
                totalActive,
                totalWaiting,
                totalDelayed,
                totalFailed,
                totalCompleted
            }
        })

    } catch (error) {
        console.error('Error checking all queues:', error.message)
        res.status(500).json({ message: 'Error checking queues', error: error.message })
    }
};

// —————————————— PROXY USAGE ENDPOINTS ——————————————

/**
 * Get proxy usage statistics for a specific crawl
 * @route GET /api/crawls/:id/proxy-stats
 */
const getCrawlProxyStats = async (req, res) => {
    const { id } = req.params;

    // Validate crawlId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' });
    }

    try {
        const stats = await proxyUsageService.getCrawlProxyStats(id);
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting crawl proxy stats:', error.message);
        res.status(500).json({ message: 'Error getting proxy stats', error: error.message });
    }
};

/**
 * Get global proxy usage statistics
 * @route GET /api/proxy-stats/global
 */
const getGlobalProxyStats = async (req, res) => {
    try {
        const stats = await proxyUsageService.getGlobalProxyStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting global proxy stats:', error.message);
        res.status(500).json({ message: 'Error getting global proxy stats', error: error.message });
    }
};

/**
 * Get proxy usage for a specific URL
 * @route GET /api/proxy-stats/url
 */
const getProxyUsageForUrl = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ message: 'URL parameter is required' });
    }

    try {
        const usage = await proxyUsageService.getProxyUsageForUrl(url);
        res.status(200).json(usage);
    } catch (error) {
        console.error('Error getting proxy usage for URL:', error.message);
        res.status(500).json({ message: 'Error getting proxy usage for URL', error: error.message });
    }
};

/**
 * Get cost analysis for proxy usage
 * @route GET /api/proxy-stats/cost-analysis
 */
const getProxyCostAnalysis = async (req, res) => {
    const { crawlId, startDate, endDate } = req.query;

    try {
        const analysis = await proxyUsageService.getCostAnalysis(
            crawlId || null,
            startDate ? new Date(startDate) : null,
            endDate ? new Date(endDate) : null
        );
        res.status(200).json(analysis);
    } catch (error) {
        console.error('Error getting proxy cost analysis:', error.message);
        res.status(500).json({ message: 'Error getting cost analysis', error: error.message });
    }
};

/**
 * Clean up old proxy usage records
 * @route DELETE /api/proxy-stats/cleanup
 */
const cleanupProxyUsage = async (req, res) => {
    const { daysOld = 90 } = req.query;

    try {
        const deletedCount = await proxyUsageService.cleanupOldRecords(parseInt(daysOld));
        res.status(200).json({ 
            message: `Cleaned up ${deletedCount} old proxy usage records`,
            deletedCount 
        });
    } catch (error) {
        console.error('Error cleaning up proxy usage records:', error.message);
        res.status(500).json({ message: 'Error cleaning up proxy usage records', error: error.message });
    }
};

module.exports = {
    crawlWebsite,
    createCrawler,
    updateCrawler,
    getCrawler,
    getAllCrawlers,
    deleteCrawler,
    checkDomainSelectors,
    getQueueStatus,
    deleteCrawlData,
    deleteCrawlDataForUrls,
    runAllCrawls,
    clearCrawlQueue,
    clearAllQueues, // Export the new function
    getAllQueuesStatus, // Export the new function
    // Proxy usage endpoints
    getCrawlProxyStats,
    getGlobalProxyStats,
    getProxyUsageForUrl,
    getProxyCostAnalysis,
    cleanupProxyUsage
}