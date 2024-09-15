const { Schema, model } = require('mongoose')

const crawlSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    urls: { 
        type: [String], // Array of URLs to be crawled
        required:true 
    },
    selectors: {
        type: {String}, // Object of CSS selectors for the crawl
    },
    userId: {
        type: String, // Placeholder for userId
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        default: 'pending'
    },
    results: [{
        type: Schema.Types.ObjectId, // Store references to CrawlData documents
        ref: 'CrawlData'
    }],
    logs: [{}],
    error: {
        type: String, // Error message, if the crawl fails
        default: '',
    },
    startTime: {
        type: Date, // Start time of the crawl
        default: Date.now,
    },
    endTime: {
        type: Date, // End time of the crawl, will be set when crawl completes
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

// Add an index on 'userId' to allow querying by userId
crawlSchema.index({ userId: 1})

//Middleware to update 'updatedAt' field automatically
crawlSchema.pre('save', function(next) {
    this.updatedAt = Date.now()
    next()
})

const Crawl = model('Crawl', crawlSchema)

module.exports = Crawl