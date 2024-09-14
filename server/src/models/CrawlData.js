const { Schema, model } = require('mongoose')
const Crawl = require('./Crawl') // Import the Crawl model

const CrawlDataSchema = new Schema({
    url: { type: String, required: true },
    data: { type: Object },
    createdAt: { type: Date, default: Date.now },
    crawlId: { type: String, required: true },
    status: { type: String, default: 'failed' },
    error: { type: String, default: null}
})

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
// create the crawl data model using the schema:
const CrawlData = model('CrawlData', CrawlDataSchema)

// export the CrawlData model
module.exports = CrawlData