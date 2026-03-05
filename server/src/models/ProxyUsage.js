const mongoose = require('mongoose');

const proxyUsageSchema = new mongoose.Schema({
    crawlId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crawl',
        required: true
    },
    url: {
        type: String,
        required: true
    },
    proxyId: {
        type: String,
        required: true
    },
    proxyLocation: {
        type: String,
        required: true
    },
    firstUsed: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    totalRequests: {
        type: Number,
        default: 1
    },
    successCount: {
        type: Number,
        default: 0
    },
    failureCount: {
        type: Number,
        default: 0
    },
    averageResponseTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'slow'],
        default: 'active'
    },
    costPerRequest: {
        type: Number,
        default: 0.001 // Default cost in USD per request
    },
    totalCost: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
proxyUsageSchema.index({ crawlId: 1, proxyId: 1 });
proxyUsageSchema.index({ url: 1, proxyId: 1 });
proxyUsageSchema.index({ lastUsed: -1 });

// Method to update usage statistics
proxyUsageSchema.methods.updateUsage = function(success, responseTime) {
    this.totalRequests += 1;
    this.lastUsed = new Date();
    
    if (success) {
        this.successCount += 1;
    } else {
        this.failureCount += 1;
    }
    
    // Update average response time
    if (responseTime) {
        const totalTime = this.averageResponseTime * (this.totalRequests - 1) + responseTime;
        this.averageResponseTime = totalTime / this.totalRequests;
    }
    
    // Update total cost
    this.totalCost = this.totalRequests * this.costPerRequest;
    
    return this.save();
};

// Static method to get proxy usage summary for a crawl
proxyUsageSchema.statics.getCrawlSummary = async function(crawlId) {
    const summary = await this.aggregate([
        { $match: { crawlId: new mongoose.Types.ObjectId(crawlId) } },
        {
            $group: {
                _id: null,
                totalProxyRequests: { $sum: '$totalRequests' },
                uniqueProxiesUsed: { $addToSet: '$proxyId' },
                totalCost: { $sum: '$totalCost' },
                totalSuccessCount: { $sum: '$successCount' },
                totalFailureCount: { $sum: '$failureCount' },
                lastProxyUsed: { $max: '$lastUsed' }
            }
        }
    ]);
    
    if (summary.length === 0) {
        return {
            totalProxyRequests: 0,
            uniqueProxiesUsed: 0,
            totalCost: 0,
            averageSuccessRate: 0,
            lastProxyUsed: null
        };
    }
    
    const result = summary[0];
    result.uniqueProxiesUsed = result.uniqueProxiesUsed.length;
    
    // Calculate overall success rate based on total successes vs total requests
    if (result.totalProxyRequests > 0) {
        result.averageSuccessRate = ((result.totalSuccessCount / result.totalProxyRequests) * 100).toFixed(2);
    } else {
        result.averageSuccessRate = 0;
    }
    
    return result;
};

// Static method to get global proxy usage summary (user-specific)
proxyUsageSchema.statics.getGlobalSummary = async function(user = null) {
    let matchStage = {};
    
    // Add user filtering if user is provided
    if (user) {
        const Crawl = require('./Crawl');
        let query = {};
        if (user.isSuperAdmin()) {
            // Superadmin can see all crawls
            query = {};
        } else {
            // Regular admin can only see their own crawls
            query = { userId: user._id };
        }
        
        const userCrawls = await Crawl.find(query).select('_id').lean();
        const userCrawlIds = userCrawls.map(crawl => crawl._id);
        matchStage.crawlId = { $in: userCrawlIds };
    }
    
    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }
    
    pipeline.push({
        $group: {
            _id: null,
            totalProxyRequests: { $sum: '$totalRequests' },
            uniqueProxiesUsed: { $addToSet: '$proxyId' },
            totalCost: { $sum: '$totalCost' },
            totalSuccessCount: { $sum: '$successCount' },
            totalFailureCount: { $sum: '$failureCount' },
            lastProxyUsed: { $max: '$lastUsed' }
        }
    });
    
    const summary = await this.aggregate(pipeline);
    
    if (summary.length === 0) {
        return {
            totalProxyRequests: 0,
            uniqueProxiesUsed: 0,
            totalCost: 0,
            averageSuccessRate: 0,
            lastProxyUsed: null
        };
    }
    
    const result = summary[0];
    result.uniqueProxiesUsed = result.uniqueProxiesUsed.length;
    
    // Calculate overall success rate based on total successes vs total requests
    if (result.totalProxyRequests > 0) {
        result.averageSuccessRate = ((result.totalSuccessCount / result.totalProxyRequests) * 100).toFixed(2);
    } else {
        result.averageSuccessRate = 0;
    }
    
    return result;
};

module.exports = mongoose.model('ProxyUsage', proxyUsageSchema); 