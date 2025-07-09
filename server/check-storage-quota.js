require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function checkStorageQuota() {
    try {
        console.log('🔍 Checking Google Drive storage quota...');
        
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
        
        // Get storage quota
        const drive = google.drive({ version: 'v3', auth });
        const res = await drive.about.get({ fields: 'storageQuota' });
        const quota = res.data.storageQuota;
        
        console.log('📊 Storage Quota Information:');
        console.log('   Total: ', formatBytes(quota.limit));
        console.log('   Used:  ', formatBytes(quota.usage));
        console.log('   Free:  ', formatBytes(quota.limit - quota.usage));
        console.log('   Usage: ', Math.round((quota.usage / quota.limit) * 100) + '%');
        
        if (quota.usage >= quota.limit) {
            console.log('❌ Storage quota exceeded!');
            console.log('💡 Solutions:');
            console.log('   1. Delete old files from the service account\'s Drive');
            console.log('   2. Use a different service account');
            console.log('   3. Upgrade the Google Workspace plan');
        } else if ((quota.usage / quota.limit) > 0.9) {
            console.log('⚠️ Storage usage is high (>90%)');
        } else {
            console.log('✅ Storage quota is sufficient');
        }
        
    } catch (error) {
        console.error('❌ Error checking storage quota:', error.message);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

checkStorageQuota(); 