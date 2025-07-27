require('dotenv').config();
const GoogleSheetsOAuth2Service = require('./src/services/googleSheetsOAuth2Service');

async function testGlobalExportFix() {
    try {
        console.log('🧪 Testing Global Export Fix');
        console.log('============================');
        
        const oauth2Service = GoogleSheetsOAuth2Service;
        
        // Check authentication
        if (!oauth2Service.isAuthenticated()) {
            console.log('❌ Not authenticated. Please run authentication first.');
            return;
        }
        
        console.log('✅ OAuth2 authentication verified');
        
        // Test global export with includeUnchanged = true
        console.log('🌍 Testing global export with includeUnchanged = true...');
        
        try {
            const result = await oauth2Service.exportGlobalChanges({
                includeUnchanged: true,
                sheetTitle: 'Global Export Test - Include Unchanged',
                limit: 10
            });
            
            if (result.error) {
                console.log('❌ Global export failed:', result.error);
                console.log('');
                console.log('💡 This might indicate:');
                console.log('   - No crawls in the database');
                console.log('   - No crawl data available');
                console.log('   - Database connection issues');
            } else {
                console.log('✅ Global export successful!');
                console.log('📄 Sheet URL:', result.sheetUrl);
                console.log('📊 Summary:', result.summaryData);
                console.log('📈 Row count:', result.rowCount);
            }
        } catch (error) {
            console.log('❌ Global export test failed:', error.message);
        }
        
        console.log('');
        console.log('🎯 Global export fix test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGlobalExportFix(); 