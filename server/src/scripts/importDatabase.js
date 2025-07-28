const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import models
const Crawl = require('../models/Crawl');
const CrawlData = require('../models/CrawlData');
const Selectors = require('../models/Selectors');
const ProxyUsage = require('../models/ProxyUsage');

const EXPORT_DIR = path.join(__dirname, '../database-export');

async function connectToLiveDB() {
    try {
        // Use the live MongoDB URI from environment
        const liveMongoUri = process.env.LIVE_MONGO_URI || process.env.MONGO_URI;
        
        if (!liveMongoUri) {
            throw new Error('LIVE_MONGO_URI or MONGO_URI environment variable is required');
        }
        
        await mongoose.connect(liveMongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to live MongoDB cluster');
    } catch (error) {
        console.error('❌ Failed to connect to live MongoDB:', error.message);
        throw error;
    }
}

async function checkExportFiles() {
    try {
        const files = await fs.readdir(EXPORT_DIR);
        const requiredFiles = ['crawls.json', 'crawlData.json', 'selectors.json', 'proxyUsage.json', 'export-summary.json'];
        
        const missingFiles = requiredFiles.filter(file => !files.includes(file));
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing export files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ All export files found');
        return files;
    } catch (error) {
        console.error('❌ Failed to check export files:', error.message);
        throw error;
    }
}

async function importCollection(collectionName, model, data) {
    try {
        console.log(`📥 Importing ${collectionName}...`);
        
        // Clear existing data (optional - comment out if you want to keep existing data)
        const deleteResult = await model.deleteMany({});
        console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing documents from ${collectionName}`);
        
        // Import new data
        if (data.length > 0) {
            const result = await model.insertMany(data, { 
                ordered: false, // Continue on errors
                rawResult: true 
            });
            console.log(`✅ Imported ${result.insertedCount} documents to ${collectionName}`);
            return result.insertedCount;
        } else {
            console.log(`ℹ️  No data to import for ${collectionName}`);
            return 0;
        }
    } catch (error) {
        console.error(`❌ Failed to import ${collectionName}:`, error.message);
        throw error;
    }
}

async function importDatabase() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting database import...');
        
        // Check export files exist
        await checkExportFiles();
        
        // Connect to live database
        await connectToLiveDB();
        
        // Read export files
        const collections = [
            { name: 'crawls', model: Crawl, file: 'crawls.json' },
            { name: 'crawlData', model: CrawlData, file: 'crawlData.json' },
            { name: 'selectors', model: Selectors, file: 'selectors.json' },
            { name: 'proxyUsage', model: ProxyUsage, file: 'proxyUsage.json' }
        ];
        
        const results = {};
        
        for (const collection of collections) {
            const filePath = path.join(EXPORT_DIR, collection.file);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            results[collection.name] = await importCollection(
                collection.name, 
                collection.model, 
                data
            );
        }
        
        // Read and display summary
        const summaryPath = path.join(EXPORT_DIR, 'export-summary.json');
        const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
        
        const duration = Date.now() - startTime;
        
        console.log('\n🎉 Database import completed successfully!');
        console.log('📊 Import Summary:');
        console.log(`   - Original export date: ${summary.exportDate}`);
        console.log(`   - Imported documents: ${Object.values(results).reduce((sum, count) => sum + count, 0)}`);
        console.log(`   - Collections: ${Object.keys(results).join(', ')}`);
        console.log(`   - Duration: ${duration}ms`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Database import failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Closed database connection');
        }
    }
}

// Run import if script is executed directly
if (require.main === module) {
    importDatabase()
        .then(() => {
            console.log('✅ Import script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Import script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { importDatabase }; 