const { chromium } = require('playwright');
const axios = require('axios');
const SelectorModel = require('./SelectorModel');
const { extractHtml } = require('../../utils/helperFunctions');

class Crawler {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await chromium.launch();
        this.page = await this.browser.newPage();
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    async crawlUrl(url, selectors) {
        try {
            if (!this.page) {
                await this.initialize();
            }

            await this.page.goto(url);
            const html = await this.page.content();
            
            // Check if HTML structure has changed
            const selectorDoc = await SelectorModel.findByDomain(new URL(url).hostname);
            if (selectorDoc && selectorDoc.hasHtmlChanged(html)) {
                console.log('HTML structure has changed for:', url);
                // You might want to notify or handle this case
            }

            // Extract data using selectors
            const extractedData = await extractHtml(html, selectors);
            
            return {
                url,
                data: extractedData,
                status: 'success'
            };
        } catch (error) {
            console.error(`Error crawling ${url}:`, error);
            return {
                url,
                status: 'failed',
                error: error.message
            };
        }
    }

    async testCrawl(url, selectors) {
        try {
            const { data } = await axios.get(url);
            const extractedData = await extractHtml(data, selectors);
            return { extractedData };
        } catch (error) {
            throw new Error(`Failed to crawl test website: ${error.message}`);
        }
    }
}

module.exports = new Crawler(); 