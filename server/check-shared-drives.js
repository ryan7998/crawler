require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function checkSharedDrives() {
    try {
        console.log('🔍 Checking for Shared Drives...');
        
        // Check if credentials file exists
        const fs = require('fs');
        const credentialsPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './server/google-credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
            console.error('❌ Credentials file not found at:', credentialsPath);
            return;
        }
        
        console.log('✅ Credentials file found at:', credentialsPath);
        
        // Initialize auth
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.file'
            ]
        });
        
        console.log('✅ Google Auth initialized');
        
        // Test Drive API access
        const drive = google.drive({ version: 'v3', auth });
        
        console.log('📁 Checking Shared Drives...');
        
        try {
            const sharedDrives = await drive.drives.list({
                pageSize: 100,
                fields: 'drives(id,name,capabilities)'
            });
            
            if (!sharedDrives.data.drives || sharedDrives.data.drives.length === 0) {
                console.log('❌ No Shared Drives found');
                console.log('');
                console.log('💡 To use Shared Drives:');
                console.log('   1. You need a Google Workspace account');
                console.log('   2. Create a Shared Drive in your Google Drive');
                console.log('   3. Add the service account as a member with appropriate permissions');
                console.log('   4. Use the Shared Drive ID instead of personal Drive');
                return;
            }
            
            console.log(`✅ Found ${sharedDrives.data.drives.length} Shared Drive(s):`);
            console.log('');
            
            sharedDrives.data.drives.forEach((sharedDrive, index) => {
                console.log(`${index + 1}. ${sharedDrive.name}`);
                console.log(`   ID: ${sharedDrive.id}`);
                console.log(`   Can add children: ${sharedDrive.capabilities?.canAddChildren || 'Unknown'}`);
                console.log(`   Can copy: ${sharedDrive.capabilities?.canCopy || 'Unknown'}`);
                console.log(`   Can delete: ${sharedDrive.capabilities?.canDelete || 'Unknown'}`);
                console.log('');
            });
            
            console.log('💡 To use a Shared Drive:');
            console.log('   - Update the folderId in your code to use a Shared Drive ID');
            console.log('   - Or create a folder within a Shared Drive and use that folder ID');
            
        } catch (error) {
            console.log('❌ Cannot access Shared Drives:', error.message);
            console.log('');
            console.log('💡 This might mean:');
            console.log('   1. You don\'t have a Google Workspace account');
            console.log('   2. Shared Drives are not enabled for your organization');
            console.log('   3. The service account doesn\'t have permission to access Shared Drives');
        }
        
    } catch (error) {
        console.error('❌ Error checking Shared Drives:', error.message);
    }
}

checkSharedDrives(); 