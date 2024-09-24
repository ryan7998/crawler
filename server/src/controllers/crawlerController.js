const axios = require('axios')

const crawlQueue = require('../queues/crawlQueue')
const Crawl = require('../models/Crawl')
const CrawlData = require('../models/CrawlData')
const { aggregateDashboard, extractHtml } = require('../../utils/helperFunctions')

const crawlWebsite = async (req, res) => {
    
    const { urls, crawlId, selectors} = req.body
    
    // it it is a test crawl
    if(!crawlId){
        const { data } = await axios.get(urls)
        // Extract data from HTML
        const extractedDatum = await extractHtml(data, selectors)
        res.json({extractedDatum})
        return
    }
    // else
    try {
        for(const url of urls){
            await crawlQueue.add({ url, crawlId })
            // await crawlQueue.add({ url, crawlId, selectors })
        }
        res.json({message: 'Crawl jobs added to queue', urls})
    } catch (error) {
        console.log('Error adding jobs to the queue: ', error.message)
        res.status(500).json({ error: `Failed to add crawl jobs. ${error.message}`})
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
    
        // Save to database
        await newCrawl.save()
        // Return the generated _id (crawlId) to the client
        res.status(201).json({ message: 'Crawl created', crawlId: newCrawl._id })
    } catch (error) {
        res.status(500).json({ message: 'Error creating crawl', error: error.message})
    }
}

const getCrawler = async (req, res) => {
    const { id } = req.params

    try{
        // Find the crawl by its ObjectId
        const crawlerData = await Crawl.findById(id)
        .select('-__v')
        .populate({
            path: 'results',
            select: '-__v'
        })

        // If the crawl doesn't exist, return a 404
        if (!crawlerData) {
            return res.status(404).json({message: 'Crawler not found'})
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
            return res.status(400).json({message: 'Invalid crawl ID'})
        }
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

module.exports = { crawlWebsite, createCrawler, getCrawler }