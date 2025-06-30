const { Schema, model } = require('mongoose')

const childSelectorSchema = new Schema({
    target_element: { type: String, required: true },
    selector_value: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'link', 'image', 'table', 'list'],
        default: 'text'
    },
    attribute: { type: String, default: null }
})

const selectorSchema = new Schema({
    target_element: { type: String, required: true },
    selector_value: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['text', 'link', 'image', 'table', 'list', 'container'],
        default: 'text'
    },
    attribute: { type: String, default: null },
    childSelectors: [childSelectorSchema]
})

const crawlSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    urls: { 
        type: [String], // Array of URLs to be crawled
        required: true 
    },
    selectors: [selectorSchema], // Array of selector objects with child selectors
    advancedSelectors: {
        type: [String], // Array of advanced CSS selectors
        default: []
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