const cheerio = require('cheerio')

const extractHtml = (html) => {
    // Load the HTML into cheerio
    const $ = cheerio.load(html)
        
    const extractedData = {}
    // Title
    extractedData.title = $('title').text().trim()
    // h1 tags
    extractedData.h1Tags = []
    $('h1').each((index, element) => {
        extractedData.h1Tags.push($(element).text())
    })
    // Price
    extractedData.extractedPrice = $('[class*="price"]').text().trim() || ''
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

    return extractedData
}

module.exports = { extractHtml }