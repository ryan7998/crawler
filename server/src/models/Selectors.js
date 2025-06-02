const mongoose = require('mongoose')
const { Schema, model } = mongoose
const { generateHtmlChecksum } = require('../utils/checksum')

const childSelectorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    selector: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'link', 'image', 'table', 'list'],
        default: 'text'
    },
    attribute: {
        type: String,
        default: null
    }
})

const selectorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    selector: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'link', 'image', 'table', 'list', 'container'],
        required: true
    },
    attribute: {
        type: String,
        default: null
    },
    childSelectors: [childSelectorSchema]
})

const selectorsSchema = new mongoose.Schema({
    domain: {
        type: String,
        required: true,
        unique: true
    },
    selectors: [selectorSchema],
    htmlChecksum: {
        type: String,
    },
    lastChecked: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// Update the updatedAt timestamp before saving
selectorsSchema.pre('save', function(next) {
    this.updatedAt = Date.now()
    next()
})

// Method to check if HTML has changed
selectorsSchema.methods.hasHtmlChanged = function(newHtml) {
    if (!this.htmlChecksum) return true; // If no previous checksum, consider it changed
    const newChecksum = generateHtmlChecksum(newHtml);
    return this.htmlChecksum !== newChecksum;
}

// Method to update HTML checksum
selectorsSchema.methods.updateHtmlChecksum = function(html) {
    this.htmlChecksum = generateHtmlChecksum(html);
    this.lastChecked = new Date();
    return this.save();
}

// create the selectors model using the schema:
const Selectors = model('Selectors', selectorsSchema)

// export the Selectors model
module.exports = Selectors