require('dotenv').config()
const mongoose = require('mongoose')
const Crawl = require('../src/models/Crawl')
const CrawlData = require('../src/models/CrawlData')
const crawlQueue = require('../src/queues/crawlQueue')

async function listCrawls() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('MongoDB connected')

        const crawls = await Crawl.find().select('_id title status createdAt urls').sort({ createdAt: -1 })
        
        console.log('\n=== Available Crawls ===')
        crawls.forEach((crawl, index) => {
            console.log(`${index + 1}. ID: ${crawl._id}`)
            console.log(`   Title: ${crawl.title}`)
            console.log(`   Status: ${crawl.status}`)
            console.log(`   URLs: ${crawl.urls.length}`)
            console.log(`   Created: ${crawl.createdAt.toLocaleDateString()}`)
            console.log('')
        })

    } catch (error) {
        console.error('Error listing crawls:', error)
    } finally {
        await mongoose.connection.close()
        process.exit(0)
    }
}

async function showCrawlData(crawlId) {
    try {
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

        // Find crawl
        const crawl = await Crawl.findById(crawlId)
        if (!crawl) {
            console.error('Crawl not found')
            return
        }

        console.log(`\n=== Crawl Details ===`)
        console.log(`ID: ${crawl._id}`)
        console.log(`Title: ${crawl.title}`)
        console.log(`Status: ${crawl.status}`)
        console.log(`URLs: ${crawl.urls.length}`)

        // Get crawl data
        const crawlData = await CrawlData.find({ crawlId }).select('url status createdAt error')
        
        console.log(`\n=== Crawl Data (${crawlData.length} entries) ===`)
        crawlData.forEach((data, index) => {
            console.log(`${index + 1}. URL: ${data.url}`)
            console.log(`   Status: ${data.status}`)
            console.log(`   Created: ${data.createdAt.toLocaleDateString()}`)
            if (data.error) {
                console.log(`   Error: ${data.error}`)
            }
            console.log('')
        })

    } catch (error) {
        console.error('Error showing crawl data:', error)
    } finally {
        await mongoose.connection.close()
        process.exit(0)
    }
}

async function deleteAllCrawlData(crawlId) {
    try {
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

        // Confirm deletion
        const readline = require('readline')
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        const answer = await new Promise((resolve) => {
            rl.question(`Are you sure you want to delete all ${dataCount} crawl data entries? (yes/no): `, resolve)
        })
        rl.close()

        if (answer.toLowerCase() !== 'yes') {
            console.log('Deletion cancelled')
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

async function deleteCrawlDataForUrls(crawlId, urls) {
    try {
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

        // Remove CrawlData entries for specific URLs
        const deleteResult = await CrawlData.deleteMany({ 
            crawlId,
            url: { $in: urls }
        })

        console.log(`Deleted ${deleteResult.deletedCount} crawl data entries for specified URLs`)

        // Remove queue jobs for specific URLs
        const jobs = await crawlQueue.getJobs(['waiting', 'active', 'delayed', 'failed'])
        let removedJobsCount = 0
        
        for (const job of jobs) {
            if (job.data.crawlId?.toString() === crawlId && urls.includes(job.data.url)) {
                await job.remove()
                removedJobsCount++
            }
        }

        console.log(`Removed ${removedJobsCount} queue jobs`)

        // Update crawl status if all data is deleted
        const remainingDataCount = await CrawlData.countDocuments({ crawlId })
        if (remainingDataCount === 0) {
            await Crawl.findByIdAndUpdate(crawlId, { 
                $set: { 
                    results: [],
                    status: 'pending',
                    startTime: null,
                    endTime: null
                }
            })
            console.log('Reset crawl status to pending (no data remaining)')
        } else {
            console.log(`${remainingDataCount} crawl data entries remaining`)
        }

        console.log('Crawl data deletion for specific URLs completed successfully')

    } catch (error) {
        console.error('Error deleting crawl data for specific URLs:', error)
    } finally {
        await mongoose.connection.close()
        await crawlQueue.close()
        process.exit(0)
    }
}

// Parse command line arguments
const command = process.argv[2]
const crawlId = process.argv[3]
const urls = process.argv.slice(4)

if (!command) {
    console.log('Usage:')
    console.log('  node utils/manageCrawlData.js list                                    - List all crawls')
    console.log('  node utils/manageCrawlData.js show <crawlId>                          - Show crawl data')
    console.log('  node utils/manageCrawlData.js delete-all <crawlId>                    - Delete all crawl data')
    console.log('  node utils/manageCrawlData.js delete-urls <crawlId> <url1> <url2>...  - Delete data for specific URLs')
    process.exit(1)
}

switch (command) {
    case 'list':
        listCrawls()
        break
    case 'show':
        if (!crawlId) {
            console.error('Please provide a crawlId')
            process.exit(1)
        }
        showCrawlData(crawlId)
        break
    case 'delete-all':
        if (!crawlId) {
            console.error('Please provide a crawlId')
            process.exit(1)
        }
        deleteAllCrawlData(crawlId)
        break
    case 'delete-urls':
        if (!crawlId || urls.length === 0) {
            console.error('Please provide a crawlId and at least one URL')
            process.exit(1)
        }
        deleteCrawlDataForUrls(crawlId, urls)
        break
    default:
        console.error('Unknown command:', command)
        process.exit(1)
} 