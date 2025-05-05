const { Schema } = require('mongoose');
const BaseModel = require('./BaseModel');
const { generateHtmlChecksum } = require('../utils/checksum');

class SelectorModel extends BaseModel {
    constructor() {
        const schema = new Schema({
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
        }, {
            timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt'}
        });

        // Add instance methods
        schema.methods.hasHtmlChanged = function(newHtml) {
            if (!this.htmlChecksum) return true;
            const newChecksum = generateHtmlChecksum(newHtml);
            return this.htmlChecksum !== newChecksum;
        };

        schema.methods.updateHtmlChecksum = function(html) {
            this.htmlChecksum = generateHtmlChecksum(html);
            this.lastChecked = new Date();
            return this.save();
        };

        super(schema);
    }

    // Add class-specific methods
    async findByDomain(domain) {
        return this.findOne({ domain });
    }

    async updateSelectors(domain, selectors) {
        return this.update(
            { domain },
            { $set: { selectors } }
        );
    }
}

module.exports = new SelectorModel(); 