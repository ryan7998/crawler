const { Schema, model, default: mongoose } = require('mongoose')
const { generateHtmlChecksum } = require('../utils/checksum')

const SelectorSchema = new Schema({
    domain: {
        type: String,
        required: true,
        unique: true
    },
    selectors: {
        type: [
            {
                target_elemnt: {type: String, require: true},
                selector_value: {type: String, required: true}
            }
        ],
        default: []
    },
    htmlChecksum: {
        type: String,
    },
    lastChecked: {
        type: Date,
        default: null
    }
},
{
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt'}
})

// Method to check if HTML has changed
SelectorSchema.methods.hasHtmlChanged = function(newHtml) {
    if (!this.htmlChecksum) return true; // If no previous checksum, consider it changed
    const newChecksum = generateHtmlChecksum(newHtml);
    return this.htmlChecksum !== newChecksum;
}

// Method to update HTML checksum
SelectorSchema.methods.updateHtmlChecksum = function(html) {
    this.htmlChecksum = generateHtmlChecksum(html);
    this.lastChecked = new Date();
    return this.save();
}

// create the Selectors model using the schema:
const Selectors = model('Selector', SelectorSchema)

// export the Selectors model
module.exports = Selectors