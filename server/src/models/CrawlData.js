const { Schema, model } = require('mongoose')
const Crawl = require('./Crawl') // Import the Crawl model

const CrawlDataSchema = new Schema({
    url: { type: String, required: true },
    data: { type: Object },
    createdAt: { type: Date, default: Date.now },
    crawlId: { type: String, required: true }
})

// Post middleware for cleanup after a CrawlData document is deleted
CrawlDataSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        // Remove the deleted CrawlData _id from the related Crawl result array
        await Crawl.updateMany(
            { result: doc._id }, // Find all Crawl docs that have the deleted CrawlData _id in result
            { $pull: { result: doc._id }} // Remove the deleted _id from the result array
        )
    }
    
})
// create the crawl data model using the schema:
const CrawlData = model('CrawlData', CrawlDataSchema)

// export the CrawlData model
module.exports = CrawlData