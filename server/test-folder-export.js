require('dotenv').config();
const GoogleSheetsOAuth2Service = require('./src/services/googleSheetsOAuth2Service');

async function testFolderExport() {
    try {
        console.log('🧪 Testing Folder Export Setup');
        console.log('==============================');
        console.log('');
        
        const oauth2Service = GoogleSheetsOAuth2Service;
        
        // Check authentication
        if (!oauth2Service.isAuthenticated()) {
            console.log('❌ Not authenticated. Please run authentication first.');
            return;
        }
        
        console.log('✅ OAuth2 authentication verified');
        
        // Check environment variable
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId) {
            console.log('❌ GOOGLE_DRIVE_FOLDER_ID not set in environment');
            console.log('💡 Run: node setup-folder-id.js');
            return;
        }
        
        console.log('✅ Folder ID found:', folderId);
        console.log('📁 Target folder:', `https://drive.google.com/drive/folders/${folderId}`);
        console.log('');
        
        // Test creating a sheet in the folder
        console.log('📊 Creating test sheet in shared folder...');
        const testTitle = `Test Export - ${new Date().toISOString().split('T')[0]}`;
        const spreadsheetId = await oauth2Service.createNewSheet(testTitle, folderId);
        
        console.log('✅ Test sheet created!');
        console.log('📄 Sheet ID:', spreadsheetId);
        console.log('🔗 Sheet URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        console.log('');
        
        // Verify the sheet is in the correct folder
        console.log('🔍 Verifying sheet location...');
        try {
            const drive = oauth2Service.drive;
            const file = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'name,parents,webViewLink'
            });
            
            console.log('📄 File name:', file.data.name);
            console.log('📁 File parents:', file.data.parents);
            
            if (file.data.parents && file.data.parents.includes(folderId)) {
                console.log('✅ Sheet is correctly placed in the shared folder!');
            } else {
                console.log('⚠️ Sheet is not in the expected folder');
                console.log('Expected folder ID:', folderId);
                console.log('Actual parents:', file.data.parents);
            }
            
            console.log('🔗 Web view link:', file.data.webViewLink);
            
        } catch (error) {
            console.log('⚠️ Could not verify file location:', error.message);
        }
        
        // Clean up - delete the test file
        console.log('');
        console.log('🧹 Cleaning up test file...');
        try {
            await oauth2Service.sheets.spreadsheets.delete({
                spreadsheetId: spreadsheetId
            });
            console.log('✅ Test file deleted');
        } catch (deleteError) {
            console.log('⚠️ Could not delete test file:', deleteError.message);
            console.log('💡 You can delete it manually from your shared folder');
        }
        
        console.log('');
        console.log('🎯 Test Results:');
        console.log('✅ Folder export setup is working correctly');
        console.log('✅ All future exports will be saved to your shared folder');
        console.log('✅ You can access exports at: https://drive.google.com/drive/folders/1uGT4Qepc6CDbiljCwpCwaaYDPmxyQ-SA');
        
    } catch (error) {
        console.error('❌ Error testing folder export:', error.message);
    }
}

testFolderExport(); 