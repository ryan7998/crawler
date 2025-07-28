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

async function connectToLocalDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to local MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to local MongoDB:', error.message);
        throw error;
    }
}

async function createExportDirectory() {
    try {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        console.log('✅ Created export directory:', EXPORT_DIR);
    } catch (error) {
        console.error('❌ Failed to create export directory:', error.message);
        throw error;
    }
}

async function exportCollection(collectionName, model) {
    try {
        console.log(`📤 Exporting ${collectionName}...`);
        
        const data = await model.find({}).lean();
        const filename = path.join(EXPORT_DIR, `${collectionName}.json`);
        
        await fs.writeFile(filename, JSON.stringify(data, null, 2));
        
        console.log(`✅ Exported ${data.length} documents to ${filename}`);
        return data.length;
    } catch (error) {
        console.error(`❌ Failed to export ${collectionName}:`, error.message);
        throw error;
    }
}

async function exportDatabase() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting database export...');
        
        // Connect to local database
        await connectToLocalDB();
        
        // Create export directory
        await createExportDirectory();
        
        // Export collections
        const collections = [
            { name: 'crawls', model: Crawl },
            { name: 'crawlData', model: CrawlData },
            { name: 'selectors', model: Selectors },
            { name: 'proxyUsage', model: ProxyUsage }
        ];
        
        const results = {};
        
        for (const collection of collections) {
            results[collection.name] = await exportCollection(collection.name, collection.model);
        }
        
        // Create summary file
        const summary = {
            exportDate: new Date().toISOString(),
            collections: results,
            totalDocuments: Object.values(results).reduce((sum, count) => sum + count, 0)
        };
        
        const summaryFile = path.join(EXPORT_DIR, 'export-summary.json');
        await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
        
        const duration = Date.now() - startTime;
        
        console.log('\n🎉 Database export completed successfully!');
        console.log('📊 Export Summary:');
        console.log(`   - Total documents: ${summary.totalDocuments}`);
        console.log(`   - Collections: ${Object.keys(results).join(', ')}`);
        console.log(`   - Duration: ${duration}ms`);
        console.log(`   - Export location: ${EXPORT_DIR}`);
        
        return summary;
        
    } catch (error) {
        console.error('❌ Database export failed:', error.message);
        throw error;
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Closed database connection');
        }
    }
}

// Run export if script is executed directly
if (require.main === module) {
    exportDatabase()
        .then(() => {
            console.log('✅ Export script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Export script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { exportDatabase }; 