const crawlQueue = require('../queues/crawlQueue')
// const axios = require('axios')
// const CrawlData = require('../models/CrawlData')
// const { extractHtml } = require('../../utils/helperFunctions')

const crawlWebsite = async (req, res) => {
    
    const { urls } = req.body

    try {
        // const extractedData = []
        // const failedCrawls = []
        // const { default: pThrottle } = await import('p-throttle') // Conditionally import throttle for node version
        // // Create a single throttle for all requests
        // const throttle = pThrottle({
        //     limit: 1,
        //     interval: 5000
        // });
        
        // Add each URL as a job to the Bull queue. Using for..of for asynchronous behaviour
        for(const url of urls){
            await crawlQueue.add({ url })
            // try{
            //     // Fetch the HTML content from the URL
            //     const throttled = throttle(async () => await axios.get(url))
            //     const { data } = await throttled()
            //     const extractedDatum = await extractHtml(data)
            //     extractedData.push(extractedDatum)
                
            //     // Save to database
            //     const newCrawl = new CrawlData({ url, html: data,  data: extractedDatum })
            //     newCrawl.save()
            // } catch(error) {
            //     if (error.response) {
            //         // Server responded with a status code out of the 2xx range
            //         console.log(`Error: Recieved ${erro.response.status} from ${url}`)
            //     } else if (error.request) {
            //         // No response received (network errors, timeouts, etc.)
            //         console.error('Error: No response received, request failed')
            //     } else {
            //         // Something else went wrong in the request
            //         console.error(`Error: ${error.message}`)
            //     }
            //     failedCrawls.push({url: url, message: error.message})
            // }
        }
        
        // Respond with the crawled data
        // res.json({ message: 'Crawl successful', data: {urls, extractedData, failedCrawls} })
        res.json({message: 'Crawl jobs added to queue', urls})
    } catch (error) {
        // console.log('Error crawling the website: ', error.message)
        // res.status(500).json({ error: `Failed to crawl the website. ${error}` })
        console.log('Error adding jobs to the queue: ', error.message)
        res.status(500).json({ error: `Failed to add crawl jobs. ${error.message}`})
    }
}

module.exports = { crawlWebsite }