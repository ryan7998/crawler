const { chromium } = require('playwright')
const path = require('path')
const { getCleanHtml, sanitizeFilename } = require('../../utils/helperFunctions')
const fs = require('fs')
const ErrorHandler = require('./ErrorHandler')

class Seed {
    constructor({ url, advancedSelectors = [] }) {
        this.url = url;
        this.protocol = this.extractProtocol()
        this.hostname = this.extractHostname()
        this.path = this.extractPath()
        this.selector = null  // Initialize as null
        this.screenshotLocation = null
        this.cleanHtmlContent = null
        this.htmlfileLocation = null
        this.extractedData = null
        this.errorHandler = new ErrorHandler()
        this.useProxy = false // Flag to enable/disable proxy
        this.proxyConfig = null // Will store proxy configuration
        this.advancedSelectors = advancedSelectors;
    }

    async initialize() {
        // Initialize selectors
        // this.selector = await this.getDefaultSelectors()
        return this
    }

    async loadHTMLContent() {
        let browser = null;
        const maxRetries = 2;
        let attempt = 1;
        
        while (attempt <= maxRetries) {
            // Track response status and errors - moved outside try block for proper scope
            let responseStatus = null;
            let responseHeaders = null;
            let pageErrors = [];
            let networkErrors = [];
            
            try {
                // Using Playwright
                console.log(`Inside loadHTMLContent() Using Playwright - Attempt ${attempt}/${maxRetries}`)
                // Launch the browser with additional options
                const browserOptions = {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-extensions',
                        '--disable-plugins',
                        '--disable-images',
                        '--disable-javascript',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-field-trial-config',
                        '--disable-ipc-flooding-protection'
                    ]
                };

                // Add proxy configuration if enabled
                if (this.useProxy && this.proxyConfig) {
                    browserOptions.proxy = this.proxyConfig;
                    console.log('Browser initialized with proxy');
                } else {
                    console.log('Browser initialized without proxy');
                }

                browser = await chromium.launch(browserOptions);

                // const context = await browser.newContext();
                // Create a new context with user agent and additional settings
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport: { width: 1920, height: 1080 },
                    ignoreHTTPSErrors: true,
                    bypassCSP: true,
                    extraHTTPHeaders: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                // Create a new page
                const page = await context.newPage()
                
                // Block analytics and tracking requests to improve performance
                await page.route('**/*', (route) => {
                    const url = route.request().url();
                    const blockedDomains = [
                        'google-analytics.com',
                        'googletagmanager.com',
                        'analytics.sharplaunch.com',
                        'js-eu1.hs-scripts.com',
                        'pagead2.googlesyndication.com',
                        'doubleclick.net',
                        'facebook.com',
                        'twitter.com'
                    ];
                    
                    if (blockedDomains.some(domain => url.includes(domain))) {
                        route.abort();
                    } else {
                        route.continue();
                    }
                });
                // page.on('console', msg => {
                //     console.log('[BROWSER LOG]', msg.text());
                // });
                // Add page-level error handling
                page.on('error', (err) => {
                    console.log('Page error:', err.message);
                    pageErrors.push(err.message);
                });
                
                page.on('pageerror', (err) => {
                    console.log('Page error:', err.message);
                    pageErrors.push(err.message);
                });

                // // Track network responses
                page.on('response', (response) => {
                    responseStatus = response.status();
                    responseHeaders = response.headers();
                    // Only log the initial response status, not every single request
                    if (response.url() === this.url) {
                        console.log(`Initial response status: ${responseStatus}`);
                    }
                });

                // Track failed requests
                page.on('requestfailed', (request) => {
                    const failure = request.failure();
                    if (failure) {
                        networkErrors.push({
                            url: request.url(),
                            errorText: failure.errorText,
                            failure: failure
                        });
                        console.log(`Request failed: ${request.url()} - ${failure.errorText}`);
                    }
                });
                
                // Add extra headers for Amazon
                if (this.hostname && this.hostname.includes('amazon')) {
                    try {
                        await page.setExtraHTTPHeaders({
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        });
                    } catch (headersError) {
                        console.log('Could not set extra headers, continuing without them:', headersError.message);
                    }
                }
                
                // Navigate to the target webpage with increased timeout and different wait strategy
                console.log(`Attempting to navigate to: ${this.url}`);
                const response = await page.goto(this.url, { 
                    waitUntil: 'networkidle',
                    timeout: 90000 
                });
                                
                // Take a screenshot of the page
                const timeNow = Date.now()
                const screenshotPath = path.join(__dirname, `../../files/${sanitizeFilename(this.url)}_${timeNow}.png`)
                await page.screenshot({path: screenshotPath, fullPage: true, timeout: 60000})
                this.screenshotLocation = screenshotPath
                // Check response status immediately
                if (response) {
                    responseStatus = response.status();
                    responseHeaders = response.headers();
                    console.log(`Initial response status: ${responseStatus}`);
                    
                    // Check for common HTTP error statuses
                    if (responseStatus >= 400) {
                        const errorInfo = this.errorHandler.analyzeHttpError(responseStatus, responseHeaders);
                        throw new Error(`HTTP ${responseStatus} Error: ${errorInfo}`);
                    }
                }
                
                // Wait a bit for dynamic content to load
                // await page.waitForTimeout(5000);
                
                // For Amazon, wait for specific elements to load
                if (this.hostname && this.hostname.includes('amazon')) {
                    try {
                        await page.waitForSelector('#productTitle, .a-size-large', { timeout: 10000 });
                    } catch (selectorError) {
                        console.log('Amazon product title selector not found, continuing...');
                    }
                }
                // todo: add title selector to check if dom is loaded.

                
                // Get the HTML content from the page
                const htmlContent = await page.content()
                // console.log('Received HTML Content: ', htmlContent)
                
                // Check if the page content indicates an error using ErrorHandler
                const contentAnalysis = this.errorHandler.analyzePageContent(htmlContent);
                if (contentAnalysis.error) {
                    // Check for captcha or anti-bot mechanisms using ErrorHandler
                    const antiBotDetection = await this.errorHandler.detectAntiBotMechanisms(page, this.advancedSelectors);
                    if (antiBotDetection) {
                        throw new Error(`Anti-bot mechanism detected: ${antiBotDetection}`);
                    }

                    // Create a custom error object that preserves contentAnalysis
                    const contentError = new Error(contentAnalysis.error);
                    contentError.contentAnalysis = contentAnalysis;
                    throw contentError;
                }
                
                // remove script and css:
                const cleanHtmlContent = getCleanHtml(htmlContent)
                
                // Save the HTML file
                const htmlPath = path.join(__dirname, `../../files/${sanitizeFilename(this.url)}-${timeNow}.html`)
                fs.writeFileSync(htmlPath, htmlContent, 'utf8')
                this.htmlfileLocation = htmlPath
                
                this.cleanHtmlContent = cleanHtmlContent
                
                // Clean up browser resources to prevent page errors
                if (browser) {
                    try {
                        await browser.close();
                        browser = null;
                    } catch (closeError) {
                        console.error('Error closing browser:', closeError);
                    }
                }
                
                return this.cleanHtmlContent

            } catch (err) {
                // Use ErrorHandler for comprehensive error analysis
                const errorContext = {
                    responseStatus,
                    responseHeaders,
                    pageErrors,
                    networkErrors,
                    url: this.url,
                    htmlContent: null, // We don't have HTML content in error cases
                    contentAnalysis: err.contentAnalysis || null // Get contentAnalysis from custom error if available
                };
                
                const errorAnalysis = this.errorHandler.analyzeError(err, errorContext);
                console.log('Error Analysis: ', errorAnalysis)
                
                // Log error with appropriate level
                this.errorHandler.logError(errorAnalysis, attempt, maxRetries);
                
                // Close browser before retry
                if (browser) {
                    try {
                        await browser.close();
                        browser = null;
                    } catch (closeError) {
                        console.error('Error closing browser:', closeError);
                    }
                }
                
                // If error is not blocking, continue with crawl
                if (!errorAnalysis.isBlocking) {
                    console.log('Non-blocking errors detected, continuing with crawl...');
                    return this.cleanHtmlContent;
                }
                
                // If this is the last attempt, throw the enhanced error
                if (attempt === maxRetries) {
                    throw new Error(`Unable to load Content after ${maxRetries} attempts: ${errorAnalysis.message}`)
                }
                
                // Check if we should retry with proxy
                if (errorAnalysis.retryWithProxy && !this.useProxy) {
                    console.log('Error suggests retry with proxy. Enabling proxy for next attempt...');
                    // this.enableProxy(); // Enable proxy with default configuration
                }
                
                // Increment attempt counter and retry
                attempt++;
                
                // Wait before retry with exponential backoff
                const waitTime = Math.min(attempt * 3000, 15000); // Max 15 seconds
                console.log(`Retrying in ${waitTime/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
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

    // Method to enable proxy with configuration
    enableProxy(proxyConfig = null) {
        this.useProxy = true;
        this.proxyConfig = proxyConfig || {
            server: process.env.OXYLAB_SERVER,
            username: process.env.OXYLAB_USERNAME,
            password: process.env.OXYLAB_PASSWORD
        };
        console.log('Proxy enabled with configuration:', this.proxyConfig);
    }

    // Method to disable proxy
    disableProxy() {
        this.useProxy = false;
        this.proxyConfig = null;
        console.log('Proxy disabled');
    }

    // Method to get proxy status and configuration
    getProxyStatus() {
        return {
            enabled: this.useProxy,
            config: this.proxyConfig
        };
    }

    // Method to update proxy configuration
    updateProxyConfig(newConfig) {
        if (this.useProxy) {
            this.proxyConfig = { ...this.proxyConfig, ...newConfig };
            console.log('Proxy configuration updated:', this.proxyConfig);
        } else {
            console.log('Proxy is not enabled. Use enableProxy() first.');
        }
    }
}

module.exports = Seed;