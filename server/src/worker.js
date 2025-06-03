const { selectors } = require('playwright');

(async () => {
    const express = require('express')
    const http = require('http')
    const mongoose = require('mongoose');
    const axios = require('axios')
    const CrawlData = require('./models/CrawlData')
    const Crawl = require('./models/Crawl')
    const { extractHtml } = require('../utils/helperFunctions')
    const crawlQueue = require('./queues/crawlQueue')
    const { initializeSocket, getSocket } = require('../utils/socket')

    const Seed = require('./classes/Seed')
    require('dotenv').config()

    const app = express()

    // Create HTTP server and pass it to socket.io
    const server = http.createServer(app)
    // Initialize Socket.io
    initializeSocket(server)

    // Track active jobs for each crawl
    const activeJobs = new Map()

    // Shared function to handle job completion/failure
    const handleJobCompletion = async (crawlId) => {
        if (!activeJobs.has(crawlId)) return

        const jobs = activeJobs.get(crawlId)
        jobs.completed++
        // If all jobs are completed
        if (jobs.completed === jobs.total) {
            // Get all CrawlData for this crawl
            const allCrawlData = await CrawlData.find({ crawlId })
            const hasFailures = allCrawlData.some(data => data.status === 'failed')
            // Update crawl status
            await Crawl.findByIdAndUpdate(crawlId, {
                status: hasFailures ? 'failed' : 'completed',
                endTime: new Date()
            })

            // Emit final status
            const io = getSocket()
            io.to(String(crawlId)).emit('crawlLog', {
                status: hasFailures ? 'failed' : 'completed',
                message: hasFailures ? 'Some URLs failed to crawl' : 'All URLs crawled successfully'
            })

            // Clean up
            activeJobs.delete(crawlId)
        }
    }

    // Listen for job completion events
    crawlQueue.on('completed', async (job) => {
        const { crawlId } = job.data
        await handleJobCompletion(crawlId)
    })

    // Listen for job failure events
    crawlQueue.on('failed', async (job, error) => {
        const { crawlId } = job.data
        await handleJobCompletion(crawlId)
    })

    //Connect to MongoDB
    mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
        // useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        .then(() => console.log('MongoDB connected'))
        .catch((err) => console.log(err))

    const extractedData = []
    const failedCrawls = []
    const { default: pThrottle } = await import('p-throttle') // Conditionally import throttle for node version

    // Set up throttling
    const throttle = pThrottle({
        limit: 1,
        interval: 2000
    })

    // Process each job in the queue
    crawlQueue.process(async (job, done) => {
        console.log('>>> [Worker] received job:', job.id, job.data);
        const { url, crawlId } = job.data
        console.log('>>> [Worker] parsed url:', url, 'crawlId:', crawlId);
        const io = getSocket()
        console.log('>>> [Worker] socket.io instance available:', !!io);

        try {
            // Initialize job tracking for this crawl if not exists
            const crawl = await Crawl.findById(crawlId)
            if (!activeJobs.has(crawlId)) {
                activeJobs.set(crawlId, {
                    total: crawl.urls.length,
                    completed: 0
                })
            }

            // Emit crawlLog event to be captured in FE log
            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'started' })
            console.log(`>>> [Worker] emitted 'started' for job ${job.id}`);

            const seed = new Seed({ url })
            if (!seed.isValid()) {
                throw new Error(`Invalid URL: ${seed.url}`)
            }
            // Initialize the seed (load selectors)
            // await seed.initialize()
            // Fetch the HTML content and extract data
            const throttled = throttle(async () => await seed.loadHTMLContent())
            const cleanHtmlContent = await throttled()
            // console.log('cleanHtmlContent: ', cleanHtmlContent)
            console.log('crawl.selectors: ', crawl.selectors)
            const extractedDatum = await extractHtml(cleanHtmlContent, crawl.selectors)
            // extractedData.push(extractedDatum)

            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'saving' })
            // Save to database
            const newCrawlData = new CrawlData({ url: seed.url, data: extractedDatum, crawlId, status: 'success' })
            // console.log('newCrawl: ', newCrawlData.data.title)
            await newCrawlData.save()

            // Emit event to clients when the crawl is completed
            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'success', result: extractedDatum })

            console.log(`Successfully crawled: ${seed.url}, Crawl Id: ${crawlId}, extractedDatum: ${extractedDatum}`)
            done(null, extractedDatum)
            // done(null)

        } catch (error) {
            console.error('>>> [Worker] error inside job:', error);
            if (error.response) {
                // Server responded with a status code out of the 2xx range
                console.log(`Error: Recieved ${error.response.status} from ${url}`)
            } else if (error.request) {
                // No response received (network errors, timeouts, etc.)
                console.error('Error: No response received, request failed')
            } else {
                // Something else went wrong in the request
                console.error(`Error: ${error.message}`)
            }
            const io = getSocket()
            io.to(crawlId).emit('crawlLog', { job: job.id, url, status: 'failed', error: error.message })
            failedCrawls.push({ url: url, message: error.message })

            // Save to database
            const newCrawlData = new CrawlData({ url: url.url, crawlId, status: 'failed', error: error.message })
            await newCrawlData.save()

            done(new Error(`Failed to crawl: ${url}. Error: ${error}`))
        }
    })
    server.listen(3002, () => {
        console.log('Worker server is running on port 3002');
    });
})()