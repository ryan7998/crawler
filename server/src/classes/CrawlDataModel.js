const { Schema } = require('mongoose');
const BaseModel = require('./BaseModel');
const CrawlModel = require('./CrawlModel');

class CrawlDataModel extends BaseModel {
    constructor() {
        const schema = new Schema({
            url: { 
                type: {}, 
                required: true 
            },
            data: { 
                type: Object 
            },
            createdAt: { 
                type: Date, 
                default: Date.now 
            },
            crawlId: { 
                type: String, 
                required: true 
            },
            status: { 
                type: String, 
                default: 'failed' 
            },
            error: { 
                type: String, 
                default: null
            }
        });

        // Add index for better query performance
        schema.index({ crawlId: 1 });

        // Add post middleware for cleanup
        schema.post('findOneAndDelete', async function(doc) {
            if (doc) {
                await CrawlModel.update(
                    { results: doc._id },
                    { $pull: { results: doc._id } }
                );
            }
        });

        super(schema);
    }

    // Add crawl data-specific methods
    async findByCrawlId(crawlId) {
        console.log('Finding crawl data for crawlId:', crawlId);
        const results = await this.find({ crawlId });
        console.log('Found crawl data:', {
            count: results.length,
            firstResult: results[0] ? {
                id: results[0]._id,
                url: results[0].url,
                status: results[0].status,
                hasData: !!results[0].data
            } : null
        });
        return results;
    }

    async createWithCrawlUpdate(data) {
        const crawlData = await this.create(data);
        await CrawlModel.addResult(data.crawlId, crawlData._id);
        return crawlData;
    }

    async deleteByCrawlId(crawlId) {
        return this.model.deleteMany({ crawlId });
    }
}

module.exports = new CrawlDataModel(); 