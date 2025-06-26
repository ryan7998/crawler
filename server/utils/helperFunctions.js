const cheerio = require('cheerio')

const extractHtml = async (html, selectors) => {
    const $ = cheerio.load(html)
    const result = {}

    // If no selectors provided, extract default data
    if (!selectors || selectors.length === 0) {
        return {
            defaultData: {
                title: $('title').text(),
                h1Tags: $('h1').map((i, el) => $(el).text()).get(),
                price: $('[class*="price"]').first().text(),
                images: $('img').map((i, el) => $(el).attr('src')).get(),
                links: $('a').map((i, el) => $(el).attr('href')).get(),
                description: $('meta[name="description"]').attr('content'),
                keywords: $('meta[name="keywords"]').attr('content')
            }
        }
    }

    // Helper function to extract data based on selector type
    const extractDataByType = (elements, selectorType, attribute) => {
        switch (selectorType) {
            case 'text':
                return elements.text().trim()
            case 'link':
                return elements.attr(attribute || 'href')
            case 'image':
                return elements.attr(attribute || 'src')
            case 'table':
                return elements.map((i, cell) => $(cell).text().trim()).get()
            case 'list':
                return elements.map((i, item) => $(item).text().trim()).get()
            default:
                return elements.text().trim()
        }
    }

    // Helper function to process a single selector
    const processSelector = (selector, $context = $) => {
        const selectorValue = selector.selector_value || selector.selector
        const elementName = selector.target_element || selector.name
        const selectorType = selector.type || 'text'
        const attribute = selector.attribute

        const elements = $context(selectorValue)
        
        if (elements.length === 0) {
            return { [elementName]: null }
        }

        // Handle container type selectors with child selectors
        if (selectorType === 'container' && selector.childSelectors) {
            const containerData = elements.map((i, container) => {
                const containerResult = {}
                const $container = $(container)

                // Process each child selector within the container
                for (const childSelector of selector.childSelectors) {
                    const childSelectorValue = childSelector.selector_value || childSelector.selector
                    const childElementName = childSelector.target_element || childSelector.name
                    const childType = childSelector.type || 'text'
                    const childAttribute = childSelector.attribute

                    const childElements = $container.find(childSelectorValue)
                    
                    if (childElements.length === 0) {
                        containerResult[childElementName] = null
                        continue
                    }

                    containerResult[childElementName] = extractDataByType(childElements, childType, childAttribute)
                }
                return containerResult
            }).get()

            return { [elementName]: containerData }
        } else {
            // Handle regular selectors
            const extractedData = extractDataByType(elements, selectorType, attribute)
            return { [elementName]: extractedData }
        }
    }

    // Process each selector
    for (const selector of selectors) {
        const selectorResult = processSelector(selector)
        Object.assign(result, selectorResult)
    }

    return result
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
                    data: result.data || null,
                    error: result.error || null
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