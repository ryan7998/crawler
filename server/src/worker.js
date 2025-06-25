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
            // Clean up crawl-specific throttle
            crawlThrottles.delete(crawlId)
        }
    }

    // Listen for job completion events
    crawlQueue.on('completed', async (job) => {
        try {
            if (!job || !job.data) {
                console.log('Job completed but job or job.data is null');
                return;
            }
            const { crawlId } = job.data
            console.log(`Job ${job.id} completed for crawl ${crawlId}`);
            await handleJobCompletion(crawlId)
        } catch (error) {
            console.error('Error in completed event handler:', error);
        }
    })

    // Listen for job failure events
    crawlQueue.on('failed', async (job, error) => {
        try {
            if (!job || !job.data) {
                console.log('Job failed but job or job.data is null');
                return;
            }
            const { crawlId } = job.data
            console.log(`Job ${job.id} failed for crawl ${crawlId}:`, error.message);
            await handleJobCompletion(crawlId)
            // Clean up crawl-specific throttle
            crawlThrottles.delete(crawlId)
        } catch (handlerError) {
            console.error('Error in failed event handler:', handlerError);
        }
    })

    // Additional queue event listeners for monitoring
    crawlQueue.on('error', (error) => {
        console.error('Queue error:', error);
    })

    crawlQueue.on('waiting', (jobId) => {
        console.log(`Job ${jobId} is waiting`);
    })

    crawlQueue.on('active', (job) => {
        if (job && job.data) {
            console.log(`Job ${job.id} is now active for crawl ${job.data.crawlId}`);
        }
    })

    crawlQueue.on('stalled', (jobId) => {
        console.log(`Job ${jobId} has stalled`);
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

    // Create crawl-specific throttles to allow concurrent crawls
    const crawlThrottles = new Map()

    // Function to get or create throttle for a specific crawl
    const getCrawlThrottle = (crawlId) => {
        if (!crawlThrottles.has(crawlId)) {
            crawlThrottles.set(crawlId, pThrottle({
                limit: 1,
                interval: 2000
            }))
        }
        return crawlThrottles.get(crawlId)
    }

    // Process each job in the queue with concurrency
    crawlQueue.process(10, async (job, done) => {
        let url, crawlId, io;
        
        try {
            if (!job || !job.data) {
                console.error('Invalid job received:', job);
                return done(new Error('Invalid job data'));
            }

            console.log('>>> [Worker] received job:', job.id, job.data);
            ({ url, crawlId } = job.data);
            
            if (!url || !crawlId) {
                console.error('Missing required job data:', { url, crawlId });
                return done(new Error('Missing required job data: url or crawlId'));
            }
            
            console.log('>>> [Worker] parsed url:', url, 'crawlId:', crawlId);
            io = getSocket()
            console.log('>>> [Worker] socket.io instance available:', !!io);

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
            // Fetch the HTML content and extract data using crawl-specific throttle
            const crawlThrottle = getCrawlThrottle(crawlId)
            const throttled = crawlThrottle(async () => await seed.loadHTMLContent())
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
                console.log(`Error: Received ${error.response.status} from ${url}`)
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

            // Save to database - fix the URL field
            const newCrawlData = new CrawlData({ 
                url: url, // Use the url directly, not url.url
                crawlId, 
                status: 'failed', 
                error: error.message 
            })
            await newCrawlData.save()

            done(new Error(`Failed to crawl: ${url}. Error: ${error.message}`))
        }
    })
    server.listen(3002, () => {
        console.log('Worker server is running on port 3002');
    });
})()