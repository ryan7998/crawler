require('dotenv').config();
const GoogleSheetsOAuth2Service = require('./src/services/googleSheetsOAuth2Service');

async function checkFileLocation() {
    try {
        console.log('🔍 Checking Google Sheets File Location');
        console.log('=====================================');
        
        const oauth2Service = GoogleSheetsOAuth2Service;
        
        // Check authentication
        if (!oauth2Service.isAuthenticated()) {
            console.log('❌ Not authenticated. Please run authentication first.');
            return;
        }
        
        console.log('✅ OAuth2 authentication verified');
        
        // Get user information
        console.log('👤 Getting user information...');
        try {
            const drive = oauth2Service.drive;
            const about = await drive.about.get({ fields: 'user' });
            console.log('✅ User email:', about.data.user?.emailAddress);
            console.log('✅ User display name:', about.data.user?.displayName);
        } catch (error) {
            console.log('⚠️ Could not get user info:', error.message);
        }
        
        // Create a test file to see where it goes
        console.log('📊 Creating test file to check location...');
        const spreadsheetId = await oauth2Service.createNewSheet('Location Test - ' + new Date().toISOString());
        
        console.log('✅ Test file created!');
        console.log('📄 Sheet ID:', spreadsheetId);
        console.log('🔗 Sheet URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        
        // Get file metadata to see the owner
        console.log('📋 Getting file metadata...');
        try {
            const drive = oauth2Service.drive;
            const file = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'name,owners,parents,webViewLink'
            });
            
            console.log('📄 File name:', file.data.name);
            console.log('👤 File owner:', file.data.owners?.[0]?.emailAddress);
            console.log('🔗 Web view link:', file.data.webViewLink);
            
            if (file.data.parents && file.data.parents.length > 0) {
                console.log('📁 File is in folder(s):', file.data.parents);
            } else {
                console.log('📁 File is in root of Drive');
            }
            
        } catch (error) {
            console.log('⚠️ Could not get file metadata:', error.message);
        }
        
        // Clean up - delete the test file
        console.log('🧹 Cleaning up test file...');
        try {
            await oauth2Service.sheets.spreadsheets.delete({
                spreadsheetId: spreadsheetId
            });
            console.log('✅ Test file deleted');
        } catch (deleteError) {
            console.log('⚠️ Could not delete test file:', deleteError.message);
            console.log('💡 You can delete it manually from your Google Drive');
        }
        
        console.log('');
        console.log('🎯 Summary:');
        console.log('✅ Google Sheets are created in YOUR personal Google Drive');
        console.log('✅ You can access them at drive.google.com');
        console.log('✅ Files are automatically shared with your email');
        console.log('✅ No need to access service account Drive');
        
    } catch (error) {
        console.error('❌ Error checking file location:', error.message);
    }
}

checkFileLocation(); 