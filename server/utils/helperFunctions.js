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

// Aggregate the crawler data grouping by urls
const aggregateDashboard = (crawlerData) => {
    const { results, urls } = crawlerData
    
    const aggregatedData = {}
    
    if(!results.length){ // New crawl or haven't run yet
        urls.map((url) => {
            aggregatedData[url] = []
        })
        return aggregatedData // Return empty array for corresponding url
    }

    // Loop through the results
    results.forEach(result => {
        let newObj = {
            date: result.createdAt,
            status: result.status,
            data: result.data ?? result.error
        }
        // If url property exists in the aggregatedData object
        if (aggregatedData[result.url]) {
            aggregatedData[result.url].push(newObj)
        } else {
        // Otherwise create new url property in the aggregatedData object
            aggregatedData[result.url] = [newObj]
        }
    })

    return aggregatedData

}
module.exports = { extractHtml, aggregateDashboard }