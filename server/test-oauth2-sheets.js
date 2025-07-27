require('dotenv').config();
const GoogleSheetsOAuth2Service = require('./src/services/googleSheetsOAuth2Service');

async function testOAuth2Sheets() {
    try {
        console.log('🧪 Testing OAuth2 Google Sheets Creation');
        console.log('=======================================');
        
        const oauth2Service = GoogleSheetsOAuth2Service;
        
        // Check authentication
        if (!oauth2Service.isAuthenticated()) {
            console.log('❌ Not authenticated. Please run authentication first.');
            return;
        }
        
        console.log('✅ OAuth2 authentication verified');
        
        // Create a test sheet
        console.log('📊 Creating test Google Sheet...');
        const spreadsheetId = await oauth2Service.createNewSheet('OAuth2 Test Sheet - ' + new Date().toISOString());
        
        console.log('✅ Test sheet created successfully!');
        console.log('📄 Sheet ID:', spreadsheetId);
        console.log('🔗 Sheet URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        
        // Test writing data
        console.log('📝 Testing data writing...');
        const testData = [
            ['Name', 'Value', 'Status'],
            ['Test 1', '100', 'Active'],
            ['Test 2', '200', 'Inactive'],
            ['Test 3', '300', 'Active']
        ];
        
        await oauth2Service.writeDataToSheet(spreadsheetId, testData);
        console.log('✅ Data written successfully!');
        
        // Test sharing (if email is configured)
        console.log('🔗 Testing sheet sharing...');
        await oauth2Service.shareSheet(spreadsheetId);
        
        console.log('');
        console.log('🎉 All tests passed! OAuth2 Google Sheets is working correctly.');
        console.log('');
        console.log('💡 The sheet has been created in your personal Google Drive.');
        console.log('💡 You can access it at the URL above.');
        console.log('');
        console.log('🧹 Cleaning up test sheet...');
        
        // Clean up - delete the test sheet
        try {
            await oauth2Service.sheets.spreadsheets.delete({
                spreadsheetId: spreadsheetId
            });
            console.log('✅ Test sheet deleted');
        } catch (deleteError) {
            console.log('⚠️ Could not delete test sheet:', deleteError.message);
            console.log('💡 You can delete it manually from your Google Drive');
        }
        
        console.log('');
        console.log('🎯 OAuth2 Google Sheets setup is complete and working!');
        console.log('🚀 You can now use the export functionality in your application.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('');
        console.log('💡 This might indicate:');
        console.log('   - Authentication issues');
        console.log('   - API quota limits');
        console.log('   - Network connectivity problems');
    }
}

testOAuth2Sheets(); 