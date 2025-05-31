const axios = require('axios')

const crawlQueue = require('../queues/crawlQueue')
const Crawl = require('../models/Crawl')
const CrawlData = require('../models/CrawlData')
const { aggregateDashboard, extractHtml } = require('../../utils/helperFunctions')
const { default: mongoose, isObjectIdOrHexString } = require('mongoose')

const crawlWebsite = async (req, res) => {

    const { urls, crawlId, selectors } = req.body

    // console.log('req.body: ', req.body)
    // it it is a test crawl
    if (!crawlId) {
        try{
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
        
        // crawlQueue.empty()
        // return 
        console.log("Adding job: ", urls, crawlId)
        // throw error
        for (const url of urls) {
            await crawlQueue.add(
                { url, crawlId },
                { removeOnComplete: true, removeOnFail: true }
            )
            // await crawlQueue.add({ url, crawlId }) // for redis 7
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
            urls,
            selectors,
            userId,
            status: 'pending',
        })
        console.log('newCrawl: ', newCrawl)
        // Save to database
        await newCrawl.save()
        // Return the generated _id (crawlId) to the client
        // res.status(201).json({ message: 'Crawl created' })
        res.status(201).json({ message: 'Crawl created', crawlId: newCrawl._id })
    } catch (error) {
        res.status(500).json({ message: 'Error creating crawl', error: error.message })
    }
}

const updateCrawler = async (req, res) => {
    const { id } = req.params
    const { title, urls } = req.body

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
        if (urls) crawl.urls = urls

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

module.exports = { crawlWebsite, createCrawler, updateCrawler, getCrawler, getAllCrawlers, deleteCrawler }