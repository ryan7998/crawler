const { chromium } = require('playwright')
const path = require('path')
const { getCleanHtml, sanitizeFilename } = require('../../utils/helperFunctions')
const fs = require('fs')
const cheerio = require('cheerio')

class Seed {
    constructor(url) {
        this.url = url.url;
        this.protocol = this.extractProtocol()
        this.hostname = this.extractHostname()
        this.path = this.extractPath()
        this.selector = null  // Initialize as null
        this.screenshotLocation = null
        this.cleanHtmlContent = null
        this.htmlfileLocation = null
        this.extractedData = null
    }

    async initialize() {
        // Initialize selectors
        this.selector = await this.getDefaultSelectors()
        return this
    }

    async loadHTMLContent() {
        try {
            // Using Playwright
            console.log('Inside loadHTMLContent() Using Playwright')
            // Launch the browser
            const browser = await chromium.launch()
            // Create a new page
            const page = await browser.newPage()
            // Navigate to the target webpage
            await page.goto(this.url);
            // Take a screenshot of the page
            const timeNow = Date.now()
            const screenshotPath = path.join(__dirname, `../../files/${sanitizeFilename(this.url)}_${timeNow}.png`)
            await page.screenshot({path: screenshotPath, fullPage: true, timeout: 60000})
            this.screenshotLocation = screenshotPath
            // Get the HTML content from the page
            const htmlContent = await page.content()
            // remove script and css:
            const cleanHtmlContent = getCleanHtml(htmlContent)
            // Save the HTML file
            const htmlPath = path.join(__dirname, `../../files/${sanitizeFilename(this.url)}-${timeNow}.html`)
            fs.writeFileSync(htmlPath, htmlContent, 'utf8')
            this.htmlfileLocation = htmlPath
            // Close the browser
            await browser.close()
            this.cleanHtmlContent = cleanHtmlContent
            
            // Extract data after loading HTML
            await this.extractData()
            return this.extractedData

        } catch (err) {
            throw new Error(`'Unable to load Content: ', ${err}`)
        }
    }

    async extractData() {
        if (!this.cleanHtmlContent) {
            throw new Error('No HTML content to extract from')
        }

        // Load the HTML into cheerio
        const $ = cheerio.load(this.cleanHtmlContent)
        const extractedData = { defaultData: {} }
        
        // If we have selectors, use them
        if (this.selector && this.selector.length) {
            this.selector.forEach(selector => {
                if (selector.target_element && selector.selector_value) {
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
            probableExtractedPrice = probableExtractedPrice.match(/\$\d+(?:\.\.?\d+)?/g) || [] // Extract prices using the regex

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

        this.extractedData = extractedData
        return extractedData
    }

    async getDefaultSelectors() {
        try {
            // Get selectors from database for this domain
            const Selectors = require('../models/Selectors');
            const domainSelectors = await Selectors.findOne({ domain: this.hostname });
            
            if (domainSelectors) {
                console.log(`Found selectors for domain: ${this.hostname}`);
                return domainSelectors.selectors;
            }
            
            console.log(`No selectors found for domain: ${this.hostname}`);
            return null;
        } catch (error) {
            console.error('Error fetching selectors:', error);
            return null;
        }
    }

    extractProtocol() {
        const protocolMatch = this.url.match(/(^\w+):\/\//)
        return protocolMatch ? protocolMatch[1] : null
    }

    extractHostname() {
        const hostnameMatch = this.url.match(/:\/\/(www\.)?([^\/:]+)/)
        return hostnameMatch ? hostnameMatch[2] : null
    }

    extractPath() {
        const pathMatch = this.url.match(/[^\/]+(\/.*)/)
        return pathMatch ? pathMatch[1] : '/'
    }

    getFullURL() {
        return `${this.protocol}://${this.hostname}${this.path}`
    }

    isValid() {
        try{
            new URL(this.url)
            return true
        } catch (error) {
            return false
        }
    }
}

module.exports = Seed;