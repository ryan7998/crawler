(async () => {
    const mongoose = require('mongoose');
    const axios = require('axios')
    const CrawlData = require('./models/CrawlData')
    const { extractHtml } = require('../utils/helperFunctions')
    const crawlQueue = require('./queues/crawlQueue')
    require('dotenv').config()


    //Connect to MongoDB
    mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
        // useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(()=> console.log('MongoDB connected'))
    .catch((err) => console.log(err))

    const extractedData = []
    const failedCrawls = []
    const { default: pThrottle } = await import('p-throttle') // Conditionally import throttle for node version

    // Set up throttling
    const throttle = pThrottle({
        limit: 1,
        interval: 2000
    });

    // Process each job in the queue
    crawlQueue.process(async (job, done) => {
        const { url } = job.data

        try{
            // Fetch the HTML content from the URL
            const throttled = throttle(async () => await axios.get(url))
            const { data } = await throttled()
            // Extract data from HTML
            const extractedDatum = await extractHtml(data)
            extractedData.push(extractedDatum)
            
            // Save to database
            const newCrawl = new CrawlData({ url, data: extractedDatum })
            console.log('newCrawl: ', newCrawl.data.title)
            newCrawl.save()

            console.log(`Successfully crawled: ${url}`)
            done()

        } catch(error) {
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
            failedCrawls.push({url: url, message: error.message})
            done(new Error('Crawl Failed'))
        }
    })
})()