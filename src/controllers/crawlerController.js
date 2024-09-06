const axios = require('axios')
const cheerio = require('cheerio')
const CrawlData = require('../models/CrawlData')

const crawlWebsite = async (req, res) => {

    const { default: pThrottle } = await import('p-throttle') // Conditionally import throttle for node version

    const { url, price } = req.body
    const throttle = pThrottle({
        limit: 2,
        interval: 1000
    });

    try {
        // Fetch the HTML content from the URL
        const throttled = await throttle(async () => await axios.get(url))
        const { data } = await throttled()

        // Load the HTML into cheerio
        const $ = cheerio.load(data)
        const extractedData = {}
    

        // Title
        extractedData.title = $('title').text().trim()
        // h1 tags
        extractedData.h1Tags = []
        $('h1').each((index, element) => {
            extractedData.h1Tags.push($(element).text())
        })
        // Price
        extractedData.extractedPrice = $(` ${ price ? price : '[class*="price"]' }`).text().trim() || ''
        // Images
        extractedData.images = []
        $('img').each((index, element) => {
            const src = $(element).attr('src')
            if(src) extractedData.images.push(src)
        })
        // <a> tags (links)
        extractedData.links = []
        $('a').each((index, element) => {
            const href = $(element).attr('href')
            if(href) extractedData.links.push(href)
        })
        // Description
        extractedData.description = $('meta[name="description"]').attr('content') || ''
        extractedData.keywords = $('meta[name="keywords"]').attr('content') || ''

        console.log(extractedData)

        // Save to database
        const newCrawl = new CrawlData({ url, html: data,  data: extractedData })
        newCrawl.save()
        
        // Respond with the crawled data
        res.json({ message: 'Crawl successful', data: {url, extractedData} })
    } catch (error) {
        console.log('Error crawling the website: ', error.message)
        res.status(500).json({ error: `Failed to crawl the website. ${error}` })
    }
}

module.exports = { crawlWebsite }