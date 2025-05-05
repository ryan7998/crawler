const { Schema } = require('mongoose');
const BaseModel = require('./BaseModel');

class CrawlModel extends BaseModel {
    constructor() {
        const schema = new Schema({
            title: {
                type: String,
                required: true,
            },
            urls: { 
                type: [{}],
                required: true 
            },
            selectors: [{}],
            userId: {
                type: String,
                required: true,
            },
            status: {
                type: String,
                enum: ['pending', 'in-progress', 'completed', 'failed'],
                default: 'pending'
            },
            results: [{
                type: Schema.Types.ObjectId,
                ref: 'CrawlData'
            }],
            logs: [{}],
            error: {
                type: String,
                default: '',
            },
            startTime: {
                type: Date,
                default: Date.now,
            },
            endTime: {
                type: Date,
            },
            updatedAt: {
                type: Date,
                default: Date.now,
            },
        });

        // Add index for better query performance
        schema.index({ userId: 1 });

        // Add middleware to update 'updatedAt' field
        schema.pre('save', function(next) {
            this.updatedAt = Date.now();
            next();
        });

        super(schema);
    }

    // Add crawl-specific methods
    async updateStatus(id, status, error = '') {
        const update = { status };
        if (error) update.error = error;
        if (status === 'completed' || status === 'failed') {
            update.endTime = new Date();
        }
        return this.update(id, update);
    }

    async addResult(id, resultId) {
        return this.update(id, {
            $push: { results: resultId }
        });
    }

    async addLog(id, log) {
        return this.update(id, {
            $push: { logs: log }
        });
    }

    async getWithResults(id) {
        return this.model.findById(id)
            .select('-__v')
            .populate({
                path: 'results',
                select: '-__v'
            });
    }

    async getAllPaginated(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        console.log('Fetching crawls with pagination:', { page, limit, skip });
        
        const [crawls, total] = await Promise.all([
            this.model.find()
                .select('-__v')
                .populate({
                    path: 'results',
                    select: '-__v'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            this.model.countDocuments()
        ]);
        
        console.log('MongoDB Response:', {
            totalCrawls: total,
            currentPageCrawls: crawls.length,
            firstCrawl: crawls[0] ? {
                id: crawls[0]._id,
                title: crawls[0].title,
                status: crawls[0].status,
                resultsCount: crawls[0].results?.length
            } : null
        });

        return {
            crawls,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}

module.exports = new CrawlModel(); 