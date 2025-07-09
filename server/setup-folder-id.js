require('dotenv').config();
const fs = require('fs');

// Extract folder ID from the URL
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

console.log('🔧 Setting up Google Drive Folder ID');
console.log('====================================');
console.log('');

console.log('🆔 Folder ID:', folderId);
console.log('');

// Check if .env file exists
const envPath = '.env';
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file');
} else {
    console.log('📝 Creating new .env file');
}

// Check if GOOGLE_DRIVE_FOLDER_ID already exists
if (envContent.includes('GOOGLE_DRIVE_FOLDER_ID=')) {
    console.log('⚠️ GOOGLE_DRIVE_FOLDER_ID already exists in .env file');
    console.log('💡 Updating existing value...');
    
    // Replace existing value
    envContent = envContent.replace(
        /GOOGLE_DRIVE_FOLDER_ID=.*/g,
        `GOOGLE_DRIVE_FOLDER_ID=${folderId}`
    );
} else {
    console.log('➕ Adding GOOGLE_DRIVE_FOLDER_ID to .env file');
    envContent += `\n# Google Drive Folder ID for exports\nGOOGLE_DRIVE_FOLDER_ID=${folderId}\n`;
}

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('');
console.log('✅ Environment variable set successfully!');
console.log('');
console.log('🎯 Next steps:');
console.log('1. Restart your server to load the new environment variable');
console.log('2. All future exports will be saved to your shared folder');
console.log('');
console.log('📋 Current .env file contents:');
console.log('----------------------------');
console.log(fs.readFileSync(envPath, 'utf8')); 