const mongoose = require('mongoose')
// const Crawl = require('./models/Crawl')
require('dotenv').config()
const Crawl           = require('../models/Crawl');

const migrateSelectors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser:    true,
            useUnifiedTopology: true,
          })

        console.log('Connected to MongoDB')
        const crawls = await Crawl.find({})
        let updatedCount = 0
        let skippedCount = 0

        // Process each crawl
        for (const crawl of crawls) {
            try {
                // Check if selectors need migration
                const needsMigration = crawl.selectors.some(selector => 
                    !selector.type || !selector.childSelectors
                )

                // Check if advancedSelectors is missing
                const needsAdvanced = typeof crawl.advancedSelectors === 'undefined'
                
                // Build update object
                const updateObj = {}
                if (needsMigration) {
                    updateObj.selectors = crawl.selectors.map(selector => ({
                        target_element: selector.target_element,
                        selector_value: selector.selector_value,
                        type: 'text', // Default type for existing selectors
                        attribute: null,
                        childSelectors: []
                    }))
                }
                if (needsAdvanced) {
                    updateObj.advancedSelectors = []
                }

                if (Object.keys(updateObj).length > 0) {
                    await Crawl.findByIdAndUpdate(crawl._id, { $set: updateObj })
                    updatedCount++
                    console.log(`Migrated crawl: ${crawl.title}`)
                } else {
                    skippedCount++
                    console.log(`Skipped crawl (already migrated): ${crawl.title}`)
                }
            } catch (error) {
                console.error(`Error migrating crawl ${crawl._id}:`, error)
            }
        }

        console.log('\nMigration Summary:')
        console.log(`Total crawls processed: ${crawls.length}`)
        console.log(`Crawls updated: ${updatedCount}`)
        console.log(`Crawls skipped: ${skippedCount}`)

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close()
        console.log('MongoDB connection closed')
    }
}

// Run the migration
migrateSelectors() 