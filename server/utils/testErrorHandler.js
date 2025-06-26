const ErrorHandler = require('../src/classes/ErrorHandler');

// Test the ErrorHandler class
async function testErrorHandler() {
    const errorHandler = new ErrorHandler();
    
    console.log('=== Testing ErrorHandler ===\n');
    
    // Test 1: JavaScript errors (non-blocking)
    console.log('Test 1: JavaScript errors (should be non-blocking)');
    const jsError = new Error('Cannot read properties of undefined (reading \'outerHTML\')');
    const jsContext = {
        responseStatus: 200,
        pageErrors: ['Cannot read properties of undefined (reading \'outerHTML\')'],
        networkErrors: []
    };
    
    const jsAnalysis = errorHandler.analyzeError(jsError, jsContext);
    console.log('Category:', jsAnalysis.category);
    console.log('Severity:', jsAnalysis.severity);
    console.log('Is Blocking:', jsAnalysis.isBlocking);
    console.log('Message:', jsAnalysis.message);
    console.log('Recovery suggestions:', jsAnalysis.recoverySuggestions);
    console.log('');
    
    // Test 2: Analytics failures (non-blocking)
    console.log('Test 2: Analytics failures (should be non-blocking)');
    const analyticsError = new Error('Network request failed');
    const analyticsContext = {
        responseStatus: 200,
        pageErrors: [],
        networkErrors: [
            { url: 'https://googletagmanager.com/gtm.js', errorText: 'net::ERR_FAILED' },
            { url: 'https://analytics.sharplaunch.com/matomo.js', errorText: 'net::ERR_FAILED' }
        ]
    };
    
    const analyticsAnalysis = errorHandler.analyzeError(analyticsError, analyticsContext);
    console.log('Category:', analyticsAnalysis.category);
    console.log('Severity:', analyticsAnalysis.severity);
    console.log('Is Blocking:', analyticsAnalysis.isBlocking);
    console.log('Message:', analyticsAnalysis.message);
    console.log('');
    
    // Test 3: HTTP 403 error (blocking)
    console.log('Test 3: HTTP 403 error (should be blocking)');
    const httpError = new Error('HTTP 403 Forbidden');
    const httpContext = {
        responseStatus: 403,
        pageErrors: [],
        networkErrors: []
    };
    
    const httpAnalysis = errorHandler.analyzeError(httpError, httpContext);
    console.log('Category:', httpAnalysis.category);
    console.log('Severity:', httpAnalysis.severity);
    console.log('Is Blocking:', httpAnalysis.isBlocking);
    console.log('Message:', httpAnalysis.message);
    console.log('Recovery suggestions:', httpAnalysis.recoverySuggestions);
    console.log('');
    
    // Test 4: Timeout error (blocking)
    console.log('Test 4: Timeout error (should be blocking)');
    const timeoutError = new Error('Timeout: Navigation timeout of 30000 ms exceeded');
    const timeoutContext = {
        responseStatus: null,
        pageErrors: [],
        networkErrors: []
    };
    
    const timeoutAnalysis = errorHandler.analyzeError(timeoutError, timeoutContext);
    console.log('Category:', timeoutAnalysis.category);
    console.log('Severity:', timeoutAnalysis.severity);
    console.log('Is Blocking:', timeoutAnalysis.isBlocking);
    console.log('Message:', timeoutAnalysis.message);
    console.log('Recovery suggestions:', timeoutAnalysis.recoverySuggestions);
    console.log('');
    
    // Test 5: Page content analysis
    console.log('Test 5: Page content analysis');
    const goodHtml = '<html><head><title>Property Details</title></head><body><h1>Property Information</h1><p>This is a detailed property listing with lots of content.</p></body></html>';
    const badHtml = '<html><head><title>404 Not Found</title></head><body><h1>Page not found</h1></body></html>';
    
    const goodContent = errorHandler.analyzePageContent(goodHtml);
    const badContent = errorHandler.analyzePageContent(badHtml);
    
    console.log('Good content analysis:', goodContent);
    console.log('Bad content analysis:', badContent);
    console.log('');
    
    // Test 6: Error logging
    console.log('Test 6: Error logging');
    errorHandler.logError(jsAnalysis, 1, 3);
    errorHandler.logError(httpAnalysis, 2, 3);
    errorHandler.logError(timeoutAnalysis, 3, 3);
    
    console.log('\n=== ErrorHandler tests completed ===');
}

// Run the test
testErrorHandler().catch(console.error); 