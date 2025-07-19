const ProxyUsage = require('../models/ProxyUsage');
const Crawl = require('../models/Crawl');

class ProxyUsageService {
    /**
     * Track proxy usage when a proxy is used for crawling
     * @param {string} crawlId - The crawl ID
     * @param {string} url - The URL being crawled
     * @param {string} proxyId - The proxy identifier from Oxylabs
     * @param {string} proxyLocation - Geographic location of the proxy
     * @param {boolean} success - Whether the request was successful
     * @param {number} responseTime - Response time in milliseconds
     * @param {number} costPerRequest - Cost per request in USD
     * @returns {Promise<Object>} Updated proxy usage record
     */
    async trackProxyUsage(crawlId, url, proxyId, proxyLocation, success = true, responseTime = 0, costPerRequest = 0.001) {
        try {
            // Find existing proxy usage record or create new one
            let proxyUsage = await ProxyUsage.findOne({
                crawlId,
                url,
                proxyId
            });

            if (!proxyUsage) {
                // Create new proxy usage record
                proxyUsage = new ProxyUsage({
                    crawlId,
                    url,
                    proxyId,
                    proxyLocation,
                    costPerRequest,
                    successCount: success ? 1 : 0,
                    failureCount: success ? 0 : 1,
                    averageResponseTime: responseTime,
                    totalCost: costPerRequest
                });
                // Save the new record
                await proxyUsage.save();
            } else {
                // Update existing record
                await proxyUsage.updateUsage(success, responseTime);
            }

            // Update crawl's proxy usage statistics
            await this.updateCrawlProxyStats(crawlId);

            return proxyUsage;
        } catch (error) {
            console.error('Error tracking proxy usage:', error);
            throw error;
        }
    }

    /**
     * Update crawl's proxy usage statistics
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<Object>} Updated crawl document
     */
    async updateCrawlProxyStats(crawlId) {
        try {
            const summary = await ProxyUsage.getCrawlSummary(crawlId);
            
            await Crawl.findByIdAndUpdate(crawlId, {
                $set: {
                    'proxyUsageStats.totalProxyRequests': summary.totalProxyRequests,
                    'proxyUsageStats.uniqueProxiesUsed': summary.uniqueProxiesUsed,
                    'proxyUsageStats.lastProxyUsed': summary.lastProxyUsed,
                    'proxyUsageStats.proxyCostEstimate': summary.totalCost,
                    'proxyUsageStats.averageProxySuccessRate': summary.averageSuccessRate
                }
            });

            return summary;
        } catch (error) {
            console.error('Error updating crawl proxy stats:', error);
            throw error;
        }
    }

    /**
     * Get proxy usage statistics for a specific crawl
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<Object>} Proxy usage statistics
     */
    async getCrawlProxyStats(crawlId) {
        try {
            const summary = await ProxyUsage.getCrawlSummary(crawlId);
            const detailedUsage = await ProxyUsage.find({ crawlId })
                .sort({ lastUsed: -1 })
                .limit(50);

            return {
                summary,
                detailedUsage,
                proxyPerformance: await this.getProxyPerformanceForCrawl(crawlId)
            };
        } catch (error) {
            console.error('Error getting crawl proxy stats:', error);
            throw error;
        }
    }

    /**
     * Get global proxy usage statistics
     * @returns {Promise<Object>} Global proxy usage statistics
     */
    async getGlobalProxyStats() {
        try {
            const summary = await ProxyUsage.getGlobalSummary();
            const topProxies = await ProxyUsage.aggregate([
                {
                    $group: {
                        _id: '$proxyId',
                        totalRequests: { $sum: '$totalRequests' },
                        successCount: { $sum: '$successCount' },
                        failureCount: { $sum: '$failureCount' },
                        totalCost: { $sum: '$totalCost' },
                        lastUsed: { $max: '$lastUsed' },
                        location: { $first: '$proxyLocation' }
                    }
                },
                {
                    $project: {
                        proxyId: '$_id',
                        totalRequests: 1,
                        successRate: {
                            $cond: [
                                { $eq: ['$totalRequests', 0] },
                                0,
                                { $multiply: [{ $divide: ['$successCount', '$totalRequests'] }, 100] }
                            ]
                        },
                        totalCost: 1,
                        lastUsed: 1,
                        location: 1
                    }
                },
                { $sort: { totalRequests: -1 } },
                { $limit: 10 }
            ]);

            return {
                summary,
                topProxies,
                recentUsage: await this.getRecentProxyUsage()
            };
        } catch (error) {
            console.error('Error getting global proxy stats:', error);
            throw error;
        }
    }

    /**
     * Get proxy performance metrics for a specific crawl
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<Array>} Proxy performance data
     */
    async getProxyPerformanceForCrawl(crawlId) {
        try {
            return await ProxyUsage.aggregate([
                { $match: { crawlId: new ProxyUsage.base.Types.ObjectId(crawlId) } },
                {
                    $group: {
                        _id: '$proxyId',
                        location: { $first: '$proxyLocation' },
                        totalRequests: { $sum: '$totalRequests' },
                        successCount: { $sum: '$successCount' },
                        failureCount: { $sum: '$failureCount' },
                        averageResponseTime: { $avg: '$averageResponseTime' },
                        totalCost: { $sum: '$totalCost' },
                        lastUsed: { $max: '$lastUsed' }
                    }
                },
                {
                    $project: {
                        proxyId: '$_id',
                        location: 1,
                        totalRequests: 1,
                        successRate: {
                            $cond: [
                                { $eq: ['$totalRequests', 0] },
                                0,
                                { $multiply: [{ $divide: ['$successCount', '$totalRequests'] }, 100] }
                            ]
                        },
                        averageResponseTime: { $round: ['$averageResponseTime', 2] },
                        totalCost: { $round: ['$totalCost', 4] },
                        lastUsed: 1
                    }
                },
                { $sort: { totalRequests: -1 } }
            ]);
        } catch (error) {
            console.error('Error getting proxy performance for crawl:', error);
            throw error;
        }
    }

    /**
     * Get recent proxy usage across all crawls
     * @param {number} limit - Number of recent records to return
     * @returns {Promise<Array>} Recent proxy usage records
     */
    async getRecentProxyUsage(limit = 20) {
        try {
            return await ProxyUsage.find()
                .sort({ lastUsed: -1 })
                .limit(limit)
                .populate('crawlId', 'title status')
                .lean();
        } catch (error) {
            console.error('Error getting recent proxy usage:', error);
            throw error;
        }
    }

    /**
     * Get proxy usage for a specific URL
     * @param {string} url - The URL to check
     * @returns {Promise<Array>} Proxy usage records for the URL
     */
    async getProxyUsageForUrl(url) {
        try {
            return await ProxyUsage.find({ url })
                .sort({ lastUsed: -1 })
                .populate('crawlId', 'title status')
                .lean();
        } catch (error) {
            console.error('Error getting proxy usage for URL:', error);
            throw error;
        }
    }

    /**
     * Get cost analysis for proxy usage
     * @param {string} crawlId - Optional crawl ID to filter by
     * @param {Date} startDate - Start date for analysis
     * @param {Date} endDate - End date for analysis
     * @returns {Promise<Object>} Cost analysis data
     */
    async getCostAnalysis(crawlId = null, startDate = null, endDate = null) {
        try {
            const matchStage = {};
            
            if (crawlId) {
                matchStage.crawlId = new ProxyUsage.base.Types.ObjectId(crawlId);
            }
            
            if (startDate || endDate) {
                matchStage.lastUsed = {};
                if (startDate) matchStage.lastUsed.$gte = new Date(startDate);
                if (endDate) matchStage.lastUsed.$lte = new Date(endDate);
            }

            const costAnalysis = await ProxyUsage.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$lastUsed' },
                            month: { $month: '$lastUsed' },
                            day: { $dayOfMonth: '$lastUsed' }
                        },
                        totalCost: { $sum: '$totalCost' },
                        totalRequests: { $sum: '$totalRequests' },
                        uniqueProxies: { $addToSet: '$proxyId' }
                    }
                },
                {
                    $project: {
                        date: {
                            $dateFromParts: {
                                year: '$_id.year',
                                month: '$_id.month',
                                day: '$_id.day'
                            }
                        },
                        totalCost: { $round: ['$totalCost', 4] },
                        totalRequests: 1,
                        uniqueProxies: { $size: '$uniqueProxies' }
                    }
                },
                { $sort: { date: 1 } }
            ]);

            return {
                dailyCosts: costAnalysis,
                totalCost: costAnalysis.reduce((sum, day) => sum + day.totalCost, 0),
                totalRequests: costAnalysis.reduce((sum, day) => sum + day.totalRequests, 0)
            };
        } catch (error) {
            console.error('Error getting cost analysis:', error);
            throw error;
        }
    }

    /**
     * Clean up old proxy usage records (for maintenance)
     * @param {number} daysOld - Remove records older than this many days
     * @returns {Promise<number>} Number of records deleted
     */
    async cleanupOldRecords(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await ProxyUsage.deleteMany({
                lastUsed: { $lt: cutoffDate }
            });

            console.log(`Cleaned up ${result.deletedCount} old proxy usage records`);
            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up old proxy usage records:', error);
            throw error;
        }
    }
}

module.exports = new ProxyUsageService(); 