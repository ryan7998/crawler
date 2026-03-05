const axios = require('axios')
const Redis = require('ioredis')
const crawlQueue = require('../queues/getCrawlQueue')

// Worker base URL (use 127.0.0.1 to avoid IPv6 localhost resolution issues on server)
const WORKER_BASE_URL = process.env.WORKER_BASE_URL || 'http://127.0.0.1:3002'
const Crawl = require('../models/Crawl')
const CrawlData = require('../models/CrawlData')
const Selectors = require('../models/Selectors')
const { aggregateDashboard } = require('../../utils/helperFunctions')
const mongoose = require('mongoose')
const proxyUsageService = require('../services/proxyUsageService')
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseUtils')
const { asyncHandler } = require('../middleware/errorHandler')

// Lazily create a shared Redis client for queue enumeration
let sharedRedis = null;
function getRedisClient() {
    if (!sharedRedis) {
        sharedRedis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
        });
    }
    return sharedRedis;
}
// Helper function to build user-based query
const buildUserQuery = (user) => {
    if (user.isSuperAdmin()) {
        // Superadmin can see all crawls
        return {};
    } else {
        // Regular admin can only see their own crawls
        // Ensure userId is properly converted to ObjectId
        const userId = mongoose.Types.ObjectId.isValid(user._id) 
            ? new mongoose.Types.ObjectId(user._id) 
            : user._id;
            
        // Try both ObjectId and string formats to handle data inconsistencies
        return { 
            $or: [
                { userId: userId },
                { userId: userId.toString() }
            ]
        };
    }
};

/**
 * Core crawl-start logic, shared by crawlWebsite and runAllCrawls.
 * Returns { alreadyRunning: true } if the crawl was already in progress,
 * { alreadyQueued: true } if jobs already existed, or { started: true }.
 */
const startCrawl = async (crawlId, urls) => {
    const existingCrawl = await Crawl.findById(crawlId)
    if (!existingCrawl) throw new Error('Crawl not found')
    if (existingCrawl.status === 'in-progress') return { alreadyRunning: true }

    await Crawl.findByIdAndUpdate(crawlId, { status: 'in-progress' })

    const q = crawlQueue(crawlId)
    const [waitingCount, activeCount, delayedCount] = await Promise.all([
        q.getWaitingCount(), q.getActiveCount(), q.getDelayedCount()
    ])
    if (waitingCount + activeCount + delayedCount > 0) {
        // Jobs already queued — still wake the worker in case it restarted
        try {
            await axios.post(`${WORKER_BASE_URL}/processor/${crawlId}`);
        } catch (err) {
            console.error('Failed to notify worker to start processor:', err.message);
        }
        return { alreadyQueued: true }
    }

    // Add jobs to the queue BEFORE waking the processor so that ensureProcessor
    // can see the waiting jobs and scope its progress counter to this runId.
    const runId = Date.now().toString();
    for (const url of urls) {
        await q.add({ url, crawlId, runId })
    }

    try {
        await axios.post(`${WORKER_BASE_URL}/processor/${crawlId}`, { runId });
    } catch (err) {
        console.error('Failed to notify worker to start processor:', err.message);
    }

    return { started: true }
}

const crawlWebsite = asyncHandler(async (req, res) => {
    const { urls, crawlId } = req.body

    const crawl = await Crawl.findById(crawlId)
    if (!crawl) {
        return sendNotFound(res, 'Crawl')
    }
    if (crawl.status === 'in-progress') {
        return sendError(res, 'Crawl is already in progress', 400, 'CRAWL_IN_PROGRESS')
    }

    const result = await startCrawl(crawlId, urls)
    if (result.alreadyQueued) {
        return sendSuccess(res, { urls }, 'Crawl jobs already exist in queue')
    }
    sendSuccess(res, { urls }, 'Crawl jobs added to queue')
})

const createCrawler = asyncHandler(async (req, res) => {
    const { title, urls, selectors, advancedSelectors, comparisonSelectors } = req.body

    // Create new crawl entry with authenticated user's ID
    const newCrawl = new Crawl({
        title,
        urls: urls.map(url => url.trim()), // Convert to array of strings
        selectors: selectors || [], // Use provided selectors or empty array
        advancedSelectors: advancedSelectors || [],
        userId: req.user._id, // Use authenticated user's ID
        status: 'pending',
        comparisonSelectors: comparisonSelectors || {},
    })

    // Save to database
    await newCrawl.save()
    sendSuccess(res, { crawlId: newCrawl._id }, 'Crawl created successfully', 201)
})

const updateCrawler = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, urls, selectors, advancedSelectors, comparisonSelectors } = req.body

    // Find the existing crawl first to check ownership
    const existingCrawl = await Crawl.findById(id)
    if (!existingCrawl) {
        return sendNotFound(res, 'Crawl')
    }

    // Check ownership
    if (!req.user.isSuperAdmin() && existingCrawl.userId.toString() !== req.user._id.toString()) {
        return sendError(res, 'Access denied. You can only update your own crawls.', 403, 'FORBIDDEN')
    }

    // Prepare update object
    const updateData = {}
    if (title) updateData.title = title
    if (urls) updateData.urls = urls.map(url => url.trim())
    if (selectors) updateData.selectors = selectors
    if (advancedSelectors) updateData.advancedSelectors = advancedSelectors
    if (typeof req.body.disabled === 'boolean') updateData.disabled = req.body.disabled
    if (comparisonSelectors) updateData.comparisonSelectors = comparisonSelectors

    // Use findByIdAndUpdate to avoid validation issues
    const updatedCrawl = await Crawl.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
    )

    if (!updatedCrawl) {
        return sendNotFound(res, 'Crawl')
    }

    sendSuccess(res, { crawl: updatedCrawl }, 'Crawl updated successfully')
})

const deleteCrawler = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }

    const crawl = await Crawl.findById(id)
    if (!crawl) {
        return res.status(404).json({ message: 'Crawl not found' })
    }

    if (!req.user.isSuperAdmin() && crawl.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete your own crawls.' })
    }

    await CrawlData.deleteMany({ crawlId: id })

    const q = crawlQueue(id)
    const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
    for (const job of jobs) {
        await job.remove()
    }

    await Crawl.findByIdAndDelete(id)
    res.status(200).json({ message: 'Crawl deleted successfully' })
})

const getCrawler = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }

    const crawlerData = await Crawl.findById(id)
        .select('-__v')
        .populate({ path: 'results', select: '-__v' })

    if (!crawlerData) {
        return res.status(404).json({ message: 'Crawler not found' })
    }

    if (!req.user.isSuperAdmin() && crawlerData.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only view your own crawls.' })
    }

    const aggregatedData = aggregateDashboard(crawlerData)
    const aggregatedCrawlObj = crawlerData.toObject()
    if (aggregatedData) {
        aggregatedCrawlObj.aggregatedData = aggregatedData
    }
    res.status(200).json(aggregatedCrawlObj)
})

const getAllCrawlers = asyncHandler(async (req, res) => {
    let query = buildUserQuery(req.user)

    if (req.query.search) {
        query.title = { $regex: req.query.search, $options: 'i' }
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const skip = (page - 1) * limit

    const crawls = await Crawl.find(query)
        .select('-__v')
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const totalCrawls = await Crawl.countDocuments(query)

    res.status(200).json({
        page,
        totalPages: Math.ceil(totalCrawls / limit),
        crawls,
        totalCrawls
    })
})

const checkDomainSelectors = asyncHandler(async (req, res) => {
    const { domain } = req.params

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
})

const getQueueStatus = asyncHandler(async (req, res) => {
    const { crawlId } = req.params

    const crawl = await Crawl.findById(crawlId);
    if (!crawl) {
        return res.status(404).json({ error: 'Crawl not found' });
    }

    if (!req.user.isSuperAdmin() && crawl.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only view queues for your own crawls.' });
    }

    const q = crawlQueue(crawlId)
    const [active, waiting, delayed, failed] = await Promise.all([
        q.getActiveCount(),
        q.getWaitingCount(),
        q.getDelayedCount(),
        q.getFailedCount()
    ])
    res.json({
        active,
        waiting,
        delayed,
        failed,
        total: active + waiting + delayed + failed
    })
})

const deleteCrawlData = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }

    const crawl = await Crawl.findById(id)
    if (!crawl) {
        return res.status(404).json({ message: 'Crawl not found' })
    }

    if (!req.user.isSuperAdmin() && crawl.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only delete data for your own crawls.' })
    }

    const deleteResult = await CrawlData.deleteMany({ crawlId: id })

    await Crawl.findByIdAndUpdate(id, {
        $set: { results: [], status: 'pending', startTime: null, endTime: null }
    })

    const q = crawlQueue(id)
    const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
    let removedJobsCount = 0
    for (const job of jobs) {
        await job.remove()
        removedJobsCount++
    }

    res.status(200).json({
        message: 'Crawl data deleted successfully',
        deletedDataCount: deleteResult.deletedCount,
        deletedJobsCount: removedJobsCount,
        crawlId: id
    })
})

const deleteCrawlDataForUrls = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { urls } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' })
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: 'URLs array is required and must not be empty' })
    }

    const crawl = await Crawl.findById(id)
    if (!crawl) {
        return res.status(404).json({ message: 'Crawl not found' })
    }

    const deleteResult = await CrawlData.deleteMany({ crawlId: id, url: { $in: urls } })

    const q = crawlQueue(id)
    const jobs = await q.getJobs(['waiting', 'active', 'delayed', 'failed'])
    let removedJobsCount = 0
    for (const job of jobs) {
        if (urls.includes(job.data.url)) {
            await job.remove()
            removedJobsCount++
        }
    }

    const remainingDataCount = await CrawlData.countDocuments({ crawlId: id })
    if (remainingDataCount === 0) {
        await Crawl.findByIdAndUpdate(id, {
            $set: { results: [], status: 'pending', startTime: null, endTime: null }
        })
    }

    res.status(200).json({
        message: 'Crawl data for specific URLs deleted successfully',
        deletedDataCount: deleteResult.deletedCount,
        deletedJobsCount: removedJobsCount,
        remainingDataCount,
        crawlId: id,
        deletedUrls: urls
    })
})

// GLOBAL RUN: Start all non-disabled crawls (user-specific)
const runAllCrawls = asyncHandler(async (req, res) => {
    let query = { disabled: { $ne: true } };
    if (!req.user.isSuperAdmin()) {
        query.userId = req.user._id;
    }

    const crawls = await Crawl.find(query);
    if (!crawls.length) {
        return res.status(200).json({ message: 'No non-disabled crawls found to start', started: [], skipped: [] });
    }

    const started = [];
    const skipped = [];

    for (const crawl of crawls) {
        try {
            const result = await startCrawl(crawl._id, crawl.urls);
            if (result.alreadyRunning) {
                skipped.push({ crawlId: crawl._id, title: crawl.title, reason: 'already in progress' });
            } else {
                started.push({ crawlId: crawl._id, title: crawl.title });
            }
        } catch (err) {
            skipped.push({ crawlId: crawl._id, title: crawl.title, reason: err.message });
        }
    }

    res.status(200).json({ message: `Started ${started.length} crawls`, started, skipped });
});

// Clear the queue for a specific crawl
const clearCrawlQueue = asyncHandler(async (req, res) => {
    const { crawlId } = req.params;

    const crawl = await Crawl.findById(crawlId);
    if (!crawl) {
        return res.status(404).json({ error: 'Crawl not found' });
    }

    if (!req.user.isSuperAdmin() && crawl.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only clear queues for your own crawls.' });
    }

    const q = crawlQueue(crawlId);
    await q.empty();
    await Crawl.findByIdAndUpdate(crawlId, { status: 'pending', startTime: null, endTime: null });
    res.status(200).json({ message: `Queue for crawl ${crawlId} cleared!` });
});

// Clear all queues (user-specific)
const clearAllQueues = asyncHandler(async (req, res) => {
    let query = {};
    if (!req.user.isSuperAdmin()) {
        query = { userId: req.user._id };
    }

    const userCrawls = await Crawl.find(query).select('_id').lean();
    const userCrawlIds = userCrawls.map(crawl => crawl._id.toString());

    if (userCrawlIds.length === 0) {
        return res.status(200).json({ message: 'No crawls found to clear queues for', clearedQueues: 0, totalJobsCleared: 0 });
    }

    const redis = getRedisClient();
    const keys = await redis.keys('bull:crawl:*')

    if (keys.length === 0) {
        return res.status(200).json({ message: 'No queues found to clear' });
    }

    let clearedQueues = 0;
    let totalJobsCleared = 0;

    for (const key of keys) {
        const parts = key.split(':')
        const crawlId = parts[2]
        if (!crawlId || !userCrawlIds.includes(crawlId)) continue

        try {
            const queue = crawlQueue(crawlId)
            const [waitingCount, activeCount, delayedCount, failedCount] = await Promise.all([
                queue.getWaitingCount(), queue.getActiveCount(),
                queue.getDelayedCount(), queue.getFailedCount()
            ])
            const jobCount = waitingCount + activeCount + delayedCount + failedCount
            if (jobCount > 0) {
                await queue.empty()
                clearedQueues++
                totalJobsCleared += jobCount
            }
        } catch (err) {
            console.error(`Error clearing queue for crawl ${crawlId}:`, err.message)
        }
    }

    res.status(200).json({
        message: `Cleared ${clearedQueues} queues with ${totalJobsCleared} total jobs`,
        clearedQueues,
        totalJobsCleared
    });
});

// Get status of all per-crawl queues (user-specific)
const getAllQueuesStatus = asyncHandler(async (req, res) => {
    let query = {};
    if (!req.user.isSuperAdmin()) {
        query = { userId: req.user._id };
    }

    const userCrawls = await Crawl.find(query).select('_id title').lean();
    const userCrawlIds = userCrawls.map(crawl => crawl._id.toString());

    const emptyResult = {
        queues: [],
        summary: { totalActive: 0, totalWaiting: 0, totalDelayed: 0, totalFailed: 0, totalCompleted: 0 }
    };

    if (userCrawlIds.length === 0) {
        return res.json(emptyResult);
    }

    const redis = getRedisClient();
    const keys = await redis.keys('bull:crawl:*')

    if (keys.length === 0) {
        return res.json(emptyResult);
    }

    let totalActive = 0, totalWaiting = 0, totalDelayed = 0, totalFailed = 0, totalCompleted = 0;
    const queues = []

    for (const key of keys) {
        const parts = key.split(':')
        const crawlId = parts[2]
        if (!crawlId || !userCrawlIds.includes(crawlId)) continue

        try {
            const queue = crawlQueue(crawlId)
            const [waitingCount, activeCount, delayedCount, failedCount, completedCount] = await Promise.all([
                queue.getWaitingCount(), queue.getActiveCount(),
                queue.getDelayedCount(), queue.getFailedCount(), queue.getCompletedCount()
            ])
            const total = waitingCount + activeCount + delayedCount + failedCount + completedCount

            if (total > 0) {
                const activeJobs = await queue.getJobs(['active'])
                const crawlMeta = userCrawls.find(c => c._id.toString() === crawlId);
                queues.push({
                    crawlId,
                    crawlTitle: crawlMeta ? crawlMeta.title : 'Unknown Crawl',
                    total,
                    waiting: waitingCount,
                    active: activeCount,
                    delayed: delayedCount,
                    failed: failedCount,
                    completed: completedCount,
                    activeJobs: activeJobs.map(job => ({ id: job.id, url: job.data.url }))
                })
                totalActive += activeCount
                totalWaiting += waitingCount
                totalDelayed += delayedCount
                totalFailed += failedCount
                totalCompleted += completedCount
            }
        } catch (err) {
            console.error(`Error checking queue for crawl ${crawlId}:`, err.message)
        }
    }

    res.json({ queues, summary: { totalActive, totalWaiting, totalDelayed, totalFailed, totalCompleted } })
});

// —————————————— PROXY USAGE ENDPOINTS ——————————————

/**
 * Get proxy usage statistics for a specific crawl
 * @route GET /api/crawls/:id/proxy-stats
 */
const getCrawlProxyStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid crawlId' });
    }

    const crawl = await Crawl.findById(id);
    if (!crawl) {
        return res.status(404).json({ error: 'Crawl not found' });
    }

    if (!req.user.isSuperAdmin() && crawl.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only view proxy stats for your own crawls.' });
    }

    const stats = await proxyUsageService.getCrawlProxyStats(id);
    res.status(200).json(stats);
});

/**
 * Get global proxy usage statistics (user-specific)
 * @route GET /api/proxy-stats/global
 */
const getGlobalProxyStats = asyncHandler(async (req, res) => {
    const stats = await proxyUsageService.getGlobalProxyStats(req.user);
    res.status(200).json(stats);
});

/**
 * Get proxy usage for a specific URL (user-specific)
 * @route GET /api/proxy-stats/url
 */
const getProxyUsageForUrl = asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ message: 'URL parameter is required' });
    }

    const usage = await proxyUsageService.getProxyUsageForUrl(url, req.user);
    res.status(200).json(usage);
});

/**
 * Get cost analysis for proxy usage (user-specific)
 * @route GET /api/proxy-stats/cost-analysis
 */
const getProxyCostAnalysis = asyncHandler(async (req, res) => {
    const { crawlId, startDate, endDate } = req.query;

    const analysis = await proxyUsageService.getCostAnalysis(
        crawlId || null,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
        req.user
    );
    res.status(200).json(analysis);
});

/**
 * Clean up old proxy usage records (user-specific)
 * @route DELETE /api/proxy-stats/cleanup
 */
const cleanupProxyUsage = asyncHandler(async (req, res) => {
    const { daysOld = 90 } = req.query;
    const deletedCount = await proxyUsageService.cleanupOldRecords(parseInt(daysOld), req.user);
    res.status(200).json({
        message: `Cleaned up ${deletedCount} old proxy usage records`,
        deletedCount
    });
});

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
    clearAllQueues,
    getAllQueuesStatus,
    getCrawlProxyStats,
    getGlobalProxyStats,
    getProxyUsageForUrl,
    getProxyCostAnalysis,
    cleanupProxyUsage
}