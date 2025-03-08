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
    require('dotenv').config()

    const app = express()

    // Create HTTP server and pass it to socket.io
    const server = http.createServer(app)
    // Initialize Socket.io
    initializeSocket(server)

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
        // const { url, crawlId } = job.data
        const { url, crawlId } = job.data
        const io = getSocket()

        try {
            // Emit crawlLog event to be captured in FE log
            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'started' })

            // Fetch the HTML content from the URL
            const throttled = throttle(async () => await axios.get(url.url))
            const { data } = await throttled()

            // Extract data from HTML
            const extractedDatum = await extractHtml(data, url.selectors)
            extractedData.push(extractedDatum)

            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'saving' })
            // Save to database
            const newCrawlData = new CrawlData({ url: url.url, data: extractedDatum, crawlId, status: 'success' })
            // console.log('newCrawl: ', newCrawlData.data.title)
            await newCrawlData.save()

            // Find the Crawl entry and push the CrawlData _id into the result array
            await Crawl.findByIdAndUpdate(
                crawlId,
                { $push: { results: newCrawlData._id } },
                { new: true }
            )

            // Emit event to clients when the crawl is completed
            io.to(String(crawlId)).emit('crawlLog', { jobId: job.id, url, status: 'success', result: extractedDatum })

            console.log(`Successfully crawled: ${url}, Crawl Id: ${crawlId}`)
            done(null, extractedDatum)

        } catch (error) {
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
            failedCrawls.push({ url: url.url, message: error.message })
            
            // Save to database
            const newCrawlData = new CrawlData({ url: url.url, crawlId, status: 'failed', error: error.message })
            await newCrawlData.save()

            // Find the Crawl entry and push the CrawlData _id into the result array
            await Crawl.findByIdAndUpdate(
                crawlId,
                { $push: { results: newCrawlData._id } },
                { new: true }
            )

            done(new Error(`Failed to crawl: ${url}. Error: ${error}`))
        }
    })
    server.listen(3002, () => {
        console.log('Worker server is running on port 3002');
    });
})()