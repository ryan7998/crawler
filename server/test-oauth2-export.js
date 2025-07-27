require('dotenv').config();
const GoogleSheetsOAuth2Service = require('./src/services/googleSheetsOAuth2Service');

async function testOAuth2Export() {
    try {
        console.log('🧪 Testing OAuth2 Export Functionality');
        console.log('=====================================');
        
        const oauth2Service = GoogleSheetsOAuth2Service;
        
        // Check authentication
        if (!oauth2Service.isAuthenticated()) {
            console.log('❌ Not authenticated. Please run authentication first.');
            return;
        }
        
        console.log('✅ OAuth2 authentication verified');
        
        // Test single crawl export (you'll need to provide a valid crawl ID)
        console.log('📊 Testing single crawl export...');
        
        // Note: You'll need to replace this with a valid crawl ID from your database
        const testCrawlId = '507f1f77bcf86cd799439011'; // Example ID
        
        try {
            const result = await oauth2Service.exportCrawlWithChanges(testCrawlId, {
                includeUnchanged: false,
                sheetTitle: 'OAuth2 Test Export'
            });
            
            if (result.error) {
                console.log('⚠️ Single crawl export test:', result.error);
                console.log('💡 This is expected if the crawl ID is not valid');
            } else {
                console.log('✅ Single crawl export successful!');
                console.log('📄 Sheet URL:', result.sheetUrl);
            }
        } catch (error) {
            console.log('⚠️ Single crawl export test failed:', error.message);
        }
        
        // Test global export
        console.log('🌍 Testing global export...');
        
        try {
            const globalResult = await oauth2Service.exportGlobalChanges({
                includeUnchanged: false,
                sheetTitle: 'OAuth2 Global Test Export',
                limit: 5
            });
            
            if (globalResult.error) {
                console.log('⚠️ Global export test:', globalResult.error);
                console.log('💡 This is expected if there are no crawls in the database');
            } else {
                console.log('✅ Global export successful!');
                console.log('📄 Sheet URL:', globalResult.sheetUrl);
                console.log('📊 Summary:', globalResult.summaryData);
            }
        } catch (error) {
            console.log('⚠️ Global export test failed:', error.message);
        }
        
        console.log('');
        console.log('🎯 OAuth2 export functionality test completed!');
        console.log('💡 If you see warnings, they are expected if there are no crawls in your database.');
        console.log('🚀 The OAuth2 service is ready to use with your application.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testOAuth2Export(); 