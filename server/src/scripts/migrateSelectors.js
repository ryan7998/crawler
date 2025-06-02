const mongoose = require('mongoose')
const Crawl = require('../models/Crawl')
require('dotenv').config()

const migrateSelectors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crawler')
        console.log('Connected to MongoDB')

        // Get all crawls
        const crawls = await Crawl.find({})
        console.log(`Found ${crawls.length} crawls to migrate`)

        let updatedCount = 0
        let skippedCount = 0

        // Process each crawl
        for (const crawl of crawls) {
            try {
                // Check if selectors need migration
                const needsMigration = crawl.selectors.some(selector => 
                    !selector.type || !selector.childSelectors
                )

                if (needsMigration) {
                    // Update selectors to new format
                    const updatedSelectors = crawl.selectors.map(selector => ({
                        target_element: selector.target_element,
                        selector_value: selector.selector_value,
                        type: 'text', // Default type for existing selectors
                        attribute: null,
                        childSelectors: []
                    }))

                    // Update the crawl document
                    await Crawl.findByIdAndUpdate(crawl._id, {
                        $set: { selectors: updatedSelectors }
                    })

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