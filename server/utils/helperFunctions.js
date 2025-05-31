const cheerio = require('cheerio')

const extractHtml = (html, selectors = []) => {
    // Load the HTML into cheerio
    const $ = cheerio.load(html)
    const extractedData = {defaultData:{}}
    
    // If user has set selectors:
    if(selectors.length) {
        selectors.forEach(selector => {
            if(selector.target_element && selector.selector_value){
                let value = ''
                // Handle multiple selectors (comma-separated)
                const selectorList = selector.selector_value.split(',').map(s => s.trim())
                
                for (const sel of selectorList) {
                    const element = $(sel)
                    if (element.length > 0) {
                        // Handle different types of elements
                        if (element.is('img')) {
                            value = element.attr('src')
                        } else if (element.is('input')) {
                            value = element.attr('value')
                        } else {
                            value = element.text().trim()
                        }
                        break // Use the first matching selector
                    }
                }
                
                extractedData[selector.target_element] = value
                console.log('selector extracted: ', selector.target_element, selector.selector_value, value)
            }
        })
    }
        
    // Default data extraction if no specific selectors found
    if (Object.keys(extractedData).length === 0) {
        // Title
        extractedData.defaultData.title = $('title').text().trim()
        // h1 tags
        extractedData.defaultData.h1Tags = []
        $('h1').each((index, element) => {
            extractedData.defaultData.h1Tags.push($(element).text())
        })
        // Price
        let probableExtractedPrice = $('[class*="price"]').text().trim() || ''
        probableExtractedPrice  = probableExtractedPrice.match(/\$\d+(?:\.\.?\d+)?/g) || [] // Extract prices using the regex

        // Proceed with cleaning as before
        probableExtractedPrice = [...new Set(probableExtractedPrice)]
        probableExtractedPrice = probableExtractedPrice.map(price => price.replace('..', '.'))

        extractedData.defaultData.price = probableExtractedPrice

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
    }

    return extractedData
}

// Aggregate the crawler data grouping by urls
const aggregateDashboard = (crawlerData) => {
    const { results, urls } = crawlerData
    
    const aggregatedData = {}
    try{
        
        // create aggregatedData hashmap Object of urls
        urls.map((url) => {
            aggregatedData[url.url] = []
        })

        if(results.length){
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
        }
        return aggregatedData
    } catch (error) {
        console.error(error)
        return aggregatedData
    }


}

// remove <script> and <css>
const getCleanHtml = (sourceCode) => {
    
    // // Load HTML from a string:
    const $ = cheerio.load(sourceCode)

    // Remove <script> and <style> elements
    $('[style]').removeAttr('style');
    $('[onload], [onclick], [onmouseover], [onmouseout]').removeAttr('onload onclick onmouseover onmouseout');
    $('script, style').remove();
    
    // Normalize Whitespace in Text Nodes:
    $('*').each(function() {
      $(this).contents().filter(function() {
        return this.type === 'text';
      }).each(function() {
        this.data = this.data.replace(/\s+/g, ' ').trim();
      });
    });
    // Get the cleaned HTML
    const cleanedHtml = $.html();
    return cleanedHtml

}

// remove special characters from fine name
const sanitizeFilename = (str) => {
    return str.replace(/[^a-z0-9]/gi, '_')
}
module.exports = { extractHtml, aggregateDashboard, getCleanHtml, sanitizeFilename }