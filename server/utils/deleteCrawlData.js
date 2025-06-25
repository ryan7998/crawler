require('dotenv').config()
const mongoose = require('mongoose')
const Crawl = require('../src/models/Crawl')
const CrawlData = require('../src/models/CrawlData')
const crawlQueue = require('../src/queues/crawlQueue')

async function deleteCrawlData(crawlId) {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('MongoDB connected')

        // Validate crawlId
        if (!mongoose.Types.ObjectId.isValid(crawlId)) {
            console.error('Invalid crawlId format')
            return
        }

        // Find existing crawl
        const crawl = await Crawl.findById(crawlId)
        if (!crawl) {
            console.error('Crawl not found')
            return
        }

        console.log(`Found crawl: ${crawl.title}`)
        console.log(`URLs in crawl: ${crawl.urls.length}`)

        // Get count of CrawlData entries before deletion
        const dataCount = await CrawlData.countDocuments({ crawlId })
        console.log(`Found ${dataCount} crawl data entries`)

        if (dataCount === 0) {
            console.log('No crawl data to delete')
            return
        }

        // Remove associated CrawlData entries
        const deleteResult = await CrawlData.deleteMany({ crawlId })
        console.log(`Deleted ${deleteResult.deletedCount} crawl data entries`)

        // Clear the results array in the Crawl document
        await Crawl.findByIdAndUpdate(crawlId, { 
            $set: { 
                results: [],
                status: 'pending',
                startTime: null,
                endTime: null
            }
        })
        console.log('Reset crawl status to pending')

        // Remove any pending jobs for this crawl from the queue
        const jobs = await crawlQueue.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            if (job.data.crawlId?.toString() === crawlId) {
                await job.remove()
                removedJobsCount++
            }
        }

        console.log(`Removed ${removedJobsCount} queue jobs`)

        console.log('Crawl data deletion completed successfully')

    } catch (error) {
        console.error('Error deleting crawl data:', error)
    } finally {
        await mongoose.connection.close()
        await crawlQueue.close()
        process.exit(0)
    }
}

// Get crawlId from command line arguments
const crawlId = process.argv[2]

if (!crawlId) {
    console.error('Please provide a crawlId as an argument')
    console.log('Usage: node utils/deleteCrawlData.js <crawlId>')
    process.exit(1)
}

deleteCrawlData(crawlId) 