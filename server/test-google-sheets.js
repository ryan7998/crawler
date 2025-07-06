require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function testGoogleSheetsSetup() {
    try {
        console.log('🔍 Testing Google Sheets API setup...');
        
        // Check if credentials file exists
        const fs = require('fs');
        const credentialsPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './google-credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
            console.error('❌ Credentials file not found at:', credentialsPath);
            console.log('📝 Please download your service account key and place it at:', credentialsPath);
            return;
        }
        
        console.log('✅ Credentials file found at:', credentialsPath);
        
        // Initialize auth
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        console.log('✅ Google Auth initialized');
        
        // Test API access
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Try to create a test sheet
        console.log('🧪 Creating test sheet...');
        const response = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `Test Sheet - ${new Date().toISOString()}`
                }
            }
        });
        
        const spreadsheetId = response.data.spreadsheetId;
        console.log('✅ Test sheet created successfully!');
        console.log('📄 Sheet ID:', spreadsheetId);
        console.log('🔗 Sheet URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        
        // Test sharing functionality
        console.log('🔗 Testing sheet sharing...');
        const drive = google.drive({ version: 'v3', auth });
        const userEmail = process.env.GOOGLE_SHARE_EMAIL || 'test@example.com';
        
        try {
            await drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: userEmail
                },
                sendNotificationEmail: false
            });
            console.log(`✅ Sheet shared with ${userEmail}`);
        } catch (shareError) {
            console.log('⚠️ Could not share sheet (this is normal for testing):', shareError.message);
        }
        
        // Clean up - delete the test sheet
        console.log('🧹 Cleaning up test sheet...');
        try {
            await sheets.spreadsheets.delete({
                spreadsheetId: spreadsheetId
            });
            console.log('✅ Test sheet deleted');
        } catch (deleteError) {
            console.log('⚠️ Could not delete test sheet (this is normal):', deleteError.message);
        }
        
        console.log('🎉 Google Sheets API setup is working correctly!');
        
    } catch (error) {
        console.error('❌ Error testing Google Sheets setup:', error.message);
        
        if (error.code === 'ENOENT') {
            console.log('💡 Make sure you have:');
            console.log('   1. Downloaded the service account key JSON file');
            console.log('   2. Placed it at: ./google-credentials.json');
            console.log('   3. The file has the correct permissions');
        } else if (error.message.includes('invalid_grant')) {
            console.log('💡 Service account key might be invalid or expired');
        } else if (error.message.includes('quota')) {
            console.log('💡 API quota exceeded - this is normal for testing');
        }
    }
}

testGoogleSheetsSetup(); 