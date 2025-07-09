require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function cleanupServiceAccount() {
    try {
        console.log('🔍 Checking service account Drive files...');
        
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
        
        // List files in the service account's Drive
        const drive = google.drive({ version: 'v3', auth });
        
        console.log('📁 Listing files in service account Drive...');
        const files = await drive.files.list({
            pageSize: 100,
            fields: 'files(id,name,mimeType,createdTime,size)',
            orderBy: 'createdTime desc'
        });
        
        if (!files.data.files || files.data.files.length === 0) {
            console.log('✅ No files found in service account Drive');
            return;
        }
        
        console.log(`📊 Found ${files.data.files.length} files:`);
        console.log('');
        
        let totalSize = 0;
        files.data.files.forEach((file, index) => {
            const size = file.size ? parseInt(file.size) : 0;
            totalSize += size;
            const createdDate = new Date(file.createdTime).toLocaleDateString();
            console.log(`${index + 1}. ${file.name} (${file.mimeType})`);
            console.log(`   ID: ${file.id}`);
            console.log(`   Created: ${createdDate}`);
            console.log(`   Size: ${formatBytes(size)}`);
            console.log('');
        });
        
        console.log(`📊 Total size: ${formatBytes(totalSize)}`);
        console.log('');
        
        // Ask if user wants to delete files
        console.log('💡 To free up space, you can:');
        console.log('   1. Delete old test files manually');
        console.log('   2. Use the Google Drive web interface');
        console.log('   3. Create a new service account');
        console.log('');
        console.log('🔗 Access service account Drive:');
        console.log('   https://drive.google.com/drive/my-drive');
        console.log('   (You may need to switch to the service account)');
        
    } catch (error) {
        console.error('❌ Error checking service account files:', error.message);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

cleanupServiceAccount(); 