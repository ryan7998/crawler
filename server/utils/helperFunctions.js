const cheerio = require('cheerio')

const extractHtml = (html, selectors = []) => {
    // Load the HTML into cheerio
    const $ = cheerio.load(html)
    const extractedData = {defaultData:{}}
    
    // If user has set selectors:
    if(selectors.length) {
        selectors.forEach(selector => {
            if(selector.name && selector.css){
                extractedData[selector.name] = $(`${selector.css}`).text().trim()
                console.log('selector extracted: ', selector.name, selector.css, extractedData[selector.name])
            }
        })
    }
        
    // Title
    extractedData.defaultData.title = $('title').text().trim()
    // h1 tags
    extractedData.defaultData.h1Tags = []
    $('h1').each((index, element) => {
        extractedData.defaultData.h1Tags.push($(element).text())
    })
    // Price
    extractedData.defaultData.extractedPrice = $('[class*="price"]').text().trim() || ''
    // Images
    extractedData.defaultData.images = []
    $('img').each((index, element) => {
        const src = $(element).attr('src')
        if(src) extractedData.defaultData.images.push(src)
    })
    // <a> tags (links)
    extractedData.defaultData.links = []
    $('a').each((index, element) => {
        const href = $(element).attr('href')
        if(href) extractedData.defaultData.links.push(href)
    })
    // Description
    extractedData.defaultData.description = $('meta[name="description"]').attr('content') || ''
    extractedData.defaultData.keywords = $('meta[name="keywords"]').attr('content') || ''

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