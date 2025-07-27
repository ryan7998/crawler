const { Schema, model } = require('mongoose')
const Crawl = require('./Crawl') // Import the Crawl model
const { determineCrawlStatus } = require('../../utils/helperFunctions')

const CrawlDataSchema = new Schema({
    crawlId: { type: Schema.Types.ObjectId, ref: 'Crawl', required: true },
    url: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'pending' },
    error: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    // Add runId field
    runId: { type: String, required: true },
});

// Post middleware for cleanup after a CrawlData document is deleted
CrawlDataSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        // Remove the deleted CrawlData _id from the related Crawl results array
        await Crawl.updateMany(
            { results: doc._id }, // Find all Crawl docs that have the deleted CrawlData _id in results
            { $pull: { results: doc._id }} // Remove the deleted _id from the results array
        )
    }
})

// Post middleware to update Crawl document after saving CrawlData
CrawlDataSchema.post('save', async function (doc) {
    try {
        // Find the related Crawl document
        const crawl = await Crawl.findById(doc.crawlId)
        if (!crawl) return

        // Add the new CrawlData _id to the results array
        await Crawl.findByIdAndUpdate(
            doc.crawlId,
            { $push: { results: doc._id } }
        )

        // Get all CrawlData documents for this crawl
        const allCrawlData = await this.constructor.find({ crawlId: doc.crawlId })
        
        // If all URLs have been crawled (success or failed)
        if (allCrawlData.length === crawl.urls.length) {
          // Determine status based on latest attempts
          const statusInfo = determineCrawlStatus(allCrawlData);
          
          // Update crawl status
          await Crawl.findByIdAndUpdate(doc.crawlId, {
            status: statusInfo.status,
            endTime: new Date()
          })
        }
    } catch (error) {
        console.error('Error in CrawlData post-save middleware:', error)
    }
})

// create the crawl data model using the schema:
const CrawlData = model('CrawlData', CrawlDataSchema)

// export the CrawlData model
module.exports = CrawlData