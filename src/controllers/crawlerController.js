const axios = require('axios')
const cheerio = require('cheerio')
const CrawlData = require('../models/CrawlData')

const crawlWebsite = async (req, res) => {
    const { url, selector } = req.body
    console.log(req.body)

    try {
        // Fetch the HTML content from the URL
        const { data } = await axios.get(url)

        // Load the HTML into cheerio
        const $ = cheerio.load(data)

        const extractedData = $(`${selector}`).text().trim()
        // const title = $('h1.site-title').text()
        // console.log(title, data)
        res.json({ message: 'Crawl successful', data: extractedData })
    } catch (error) {
        console.log('Error crawling the website: ', error.message)
        res.status(500).json({ error: 'Failed to crawl the website' })
    }
}

module.exports = { crawlWebsite }