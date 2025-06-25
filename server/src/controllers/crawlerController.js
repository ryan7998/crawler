const axios = require('axios')
const crawlQueue = require('../queues/crawlQueue')
const Crawl = require('../models/Crawl')
const CrawlData = require('../models/CrawlData')
const Selectors = require('../models/Selectors')
const { aggregateDashboard, extractHtml } = require('../../utils/helperFunctions')
const { default: mongoose, isObjectIdOrHexString } = require('mongoose')

const crawlWebsite = async (req, res) => {
    const { urls, crawlId, selectors } = req.body

    // it it is a test crawl
    if (!crawlId) {
        try {
            const { data } = await axios.get(urls)
            // Extract data from HTML
            const extractedDatum = await extractHtml(data, selectors)
            res.json({ extractedDatum })

        } catch (error) {
            console.log('Error crawling test website: ', error.message)
            res.status(500).json({ message: `Failed to crawl test website. ${error.message}` })
        }
        return
    }
    // else
    try {
        // Update crawl status to in-progress
        await Crawl.findByIdAndUpdate(crawlId, { status: 'in-progress' })

        console.log("Adding job: ", urls, crawlId)
        for (const url of urls) {
            // Use different queue configurations based on environment
            if (process.env.NODE_ENV === 'production') {
                await crawlQueue.add({ url, crawlId }) // for redis 7
            } else {
                await crawlQueue.add(
                    { url, crawlId },
                    { removeOnComplete: true, removeOnFail: true }
                )
            }
        }
        res.json({ message: 'Crawl jobs added to queue', urls })
    } catch (error) {
        console.log('Error adding jobs to the queue: ', error.message)
        res.status(500).json({ error: `Failed to add crawl jobs. ${error.message}` })
    }
}

const createCrawler = async (req, res) => {
    const { title, urls, selectors, userId } = req.body

    try {
        // Create new crawl entry
        const newCrawl = new Crawl({
            title,
            urls: urls.map(url => url.trim()), // Convert to array of strings
            selectors: selectors || [], // Use provided selectors or empty array
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
    const { title, urls, selectors } = req.body

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
        // Remove jobs related ot this crawl from the queue
        console.log('deleting jobs')
        const jobs = await crawlQueue.getJobs(['waiting', 'active', 'delayed', 'failed'])
        // console.log('jobs: ', jobs)
        for (const job of jobs) {
            console.log('job ids, ', job.data.crawlId, id)
            if (job.data.crawlId?.toString() === id) {
                await job.remove()
            }
            console.log('finished deleting. ')
        }
        console.log('deleting crawl')
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
        // Biuld the query
        let query = {}
        // Implement pagination
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const skip = (page - 1) * limit

        // Fetch crawls from the database
        const crawls = await Crawl.find(query)
            .select('-__v') // Exclude the __v field
            .populate({
                path: 'results',
                select: '-__v'
            })
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const totalCrawls = await Crawl.countDocuments(query)

        res.status(200).json({
            page,
            totalPages: Math.ceil(totalCrawls / limit),
            crawls
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
        const jobs = await crawlQueue.getJobs(['active', 'waiting', 'delayed'])
        const crawlJobs = jobs.filter(job => job.data.crawlId === crawlId)
        res.json({
            active: crawlJobs.filter(job => job.status === 'active').length,
            waiting: crawlJobs.filter(job => job.status === 'waiting').length,
            delayed: crawlJobs.filter(job => job.status === 'delayed').length,
            total: crawlJobs.length
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
        const jobs = await crawlQueue.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            if (job.data.crawlId?.toString() === id) {
                await job.remove()
                removedJobsCount++
            }
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
        const jobs = await crawlQueue.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            if (job.data.crawlId?.toString() === id && urls.includes(job.data.url)) {
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
    deleteCrawlDataForUrls
}