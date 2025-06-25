require('dotenv').config()
const { chromium } = require('playwright')

async function testPlaywright() {
    let browser = null;
    try {
        console.log('Testing Playwright setup...')
        
        // Launch browser
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
        
        console.log('Browser launched successfully')
        
        // Create context
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });
        
        console.log('Context created successfully')
        
        // Create page
        const page = await context.newPage()
        console.log('Page created successfully')
        
        // Test navigation
        await page.goto('https://httpbin.org/get', { timeout: 30000 })
        console.log('Navigation successful')
        
        // Test content retrieval
        const content = await page.content()
        console.log('Content retrieved successfully, length:', content.length)
        
        // Test screenshot
        const screenshot = await page.screenshot({ fullPage: true })
        console.log('Screenshot taken successfully, size:', screenshot.length)
        
        console.log('All Playwright tests passed!')
        
    } catch (error) {
        console.error('Playwright test failed:', error)
    } finally {
        if (browser) {
            await browser.close()
        }
        process.exit(0)
    }
}

testPlaywright() 