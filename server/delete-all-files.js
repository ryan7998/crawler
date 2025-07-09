require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function deleteAllFiles() {
    try {
        console.log('🧹 Cleaning up service account Drive...');
        
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
                'https://www.googleapis.com/auth/drive'
            ]
        });
        
        console.log('✅ Google Auth initialized');
        
        // List all files in the service account's Drive
        const drive = google.drive({ version: 'v3', auth });
        
        console.log('📁 Fetching all files...');
        const files = await drive.files.list({
            pageSize: 1000,
            fields: 'files(id,name,mimeType,createdTime)',
            orderBy: 'createdTime desc'
        });
        
        if (!files.data.files || files.data.files.length === 0) {
            console.log('✅ No files found in service account Drive');
            return;
        }
        
        console.log(`📊 Found ${files.data.files.length} files total`);
        
        // Filter out the shared folder (we want to keep this)
        const sharedFolderId = '1uGT4Qepc6CDbiljCwpCwaaYDPmxyQ-SA';
        const filesToDelete = files.data.files.filter(file => file.id !== sharedFolderId);
        
        console.log(`🗑️ Will delete ${filesToDelete.length} files (keeping shared folder)`);
        console.log('');
        
        // Show what will be deleted
        filesToDelete.forEach((file, index) => {
            const createdDate = new Date(file.createdTime).toLocaleDateString();
            console.log(`${index + 1}. ${file.name} (${file.mimeType}) - ${createdDate}`);
        });
        
        console.log('');
        console.log('⚠️ This will permanently delete all files except the shared folder!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
        
        // Wait 5 seconds to give user time to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🗑️ Starting deletion...');
        
        // Delete files in batches to avoid rate limiting
        const batchSize = 10;
        let deletedCount = 0;
        
        for (let i = 0; i < filesToDelete.length; i += batchSize) {
            const batch = filesToDelete.slice(i, i + batchSize);
            
            console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}...`);
            
            for (const file of batch) {
                try {
                    await drive.files.delete({
                        fileId: file.id
                    });
                    console.log(`✅ Deleted: ${file.name}`);
                    deletedCount++;
                } catch (error) {
                    console.log(`❌ Failed to delete ${file.name}: ${error.message}`);
                }
            }
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < filesToDelete.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('');
        console.log(`🎉 Cleanup complete! Deleted ${deletedCount} files.`);
        console.log('✅ Shared folder preserved.');
        console.log('');
        console.log('💡 You can now try creating new Google Sheets again.');
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    }
}

deleteAllFiles(); 