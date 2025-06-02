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
        // this.selector = await this.getDefaultSelectors()
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
            console.log('Recieved HTML Content')
            // remove script and css:
            const cleanHtmlContent = getCleanHtml(htmlContent)
            // Save the HTML file
            const htmlPath = path.join(__dirname, `../../files/${sanitizeFilename(this.url)}-${timeNow}.html`)
            fs.writeFileSync(htmlPath, htmlContent, 'utf8')
            this.htmlfileLocation = htmlPath
            // Close the browser
            await browser.close()
            this.cleanHtmlContent = cleanHtmlContent
            return this.cleanHtmlContent

        } catch (err) {
            throw new Error(`'Unable to load Content: ', ${err}`)
        }
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