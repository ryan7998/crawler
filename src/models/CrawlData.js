const { Schema, model } = require('mongoose')

const CrawlDataSchema = new Schema({
    url: { type: String, required:true },
    data: { type: Object },
    createdAt: { type: Date, default: Date.now },
})

// create the crawl data model using the schema:
const CrawlData = model('CrawlData', CrawlDataSchema)

// export the CrawlData model
module.exports = CrawlData