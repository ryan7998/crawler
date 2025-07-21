const ProxyUsage = require('../models/ProxyUsage');
const Crawl = require('../models/Crawl');
const BaseService = require('./BaseService');
const {
    buildProxyPerformancePipeline,
    buildCostAnalysisPipeline,
    buildSummaryPipeline,
    createDateRangeMatch,
    createCrawlMatch
} = require('../utils/aggregationPipelines');

class ProxyUsageService extends BaseService {
    constructor() {
        super(ProxyUsage);
    }

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
            let proxyUsage = await this.findOne({
                crawlId,
                url,
                proxyId
            });

            if (!proxyUsage) {
                // Create new proxy usage record
                proxyUsage = await this.create({
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
            } else {
                // Update existing record
                await proxyUsage.updateUsage(success, responseTime);
            }

            // Update crawl's proxy usage statistics
            await this.updateCrawlProxyStats(crawlId);

            return proxyUsage;
        } catch (error) {
            this.handleError('trackProxyUsage', error);
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
            const proxyPerformance = await this.getProxyPerformanceForCrawl(crawlId);
            const detailedUsage = await this.getDetailedUsageForCrawl(crawlId);

            return {
                summary,
                proxyPerformance,
                detailedUsage
            };
        } catch (error) {
            this.handleError('getCrawlProxyStats', error);
        }
    }

    /**
     * Get global proxy usage statistics
     * @returns {Promise<Object>} Global proxy usage statistics
     */
    async getGlobalProxyStats() {
        try {
            const summary = await ProxyUsage.getGlobalSummary();
            const topProxies = await this.getTopProxies();
            const recentUsage = await this.getRecentProxyUsage();

            return {
                summary,
                topProxies,
                recentUsage
            };
        } catch (error) {
            this.handleError('getGlobalProxyStats', error);
        }
    }

    /**
     * Get proxy performance metrics for a specific crawl
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<Array>} Proxy performance data
     */
    async getProxyPerformanceForCrawl(crawlId) {
        try {
            const matchStage = createCrawlMatch(crawlId);
            const pipeline = buildProxyPerformancePipeline({ matchStage });
            return await this.aggregate(pipeline);
        } catch (error) {
            this.handleError('getProxyPerformanceForCrawl', error);
        }
    }

    /**
     * Get top performing proxies globally
     * @param {number} limit - Number of proxies to return
     * @returns {Promise<Array>} Top proxies data
     */
    async getTopProxies(limit = 10) {
        try {
            const pipeline = buildProxyPerformancePipeline({ limit });
            return await this.aggregate(pipeline);
        } catch (error) {
            this.handleError('getTopProxies', error);
        }
    }

    /**
     * Get detailed usage for a specific crawl
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<Array>} Detailed usage data
     */
    async getDetailedUsageForCrawl(crawlId) {
        try {
            const matchStage = createCrawlMatch(crawlId);
            const pipeline = [
                { $match: matchStage },
                {
                    $project: {
                        url: 1,
                        proxyId: 1,
                        proxyLocation: 1,
                        totalRequests: 1,
                        successCount: 1,
                        failureCount: 1,
                        totalCost: { $round: ['$totalCost', 4] },
                        lastUsed: 1
                    }
                },
                { $sort: { lastUsed: -1 } }
            ];
            
            return await this.aggregate(pipeline);
        } catch (error) {
            this.handleError('getDetailedUsageForCrawl', error);
        }
    }

    /**
     * Get recent proxy usage globally
     * @param {number} limit - Number of records to return
     * @returns {Promise<Array>} Recent usage data
     */
    async getRecentProxyUsage(limit = 20) {
        try {
            const pipeline = [
                {
                    $project: {
                        url: 1,
                        proxyId: 1,
                        proxyLocation: 1,
                        totalRequests: 1,
                        successCount: 1,
                        failureCount: 1,
                        totalCost: { $round: ['$totalCost', 4] },
                        lastUsed: 1
                    }
                },
                { $sort: { lastUsed: -1 } },
                { $limit: limit }
            ];
            
            return await this.aggregate(pipeline);
        } catch (error) {
            this.handleError('getRecentProxyUsage', error);
        }
    }

    /**
     * Get cost analysis for proxy usage
     * @param {string} crawlId - Optional crawl ID to filter by
     * @param {Date} startDate - Optional start date
     * @param {Date} endDate - Optional end date
     * @returns {Promise<Object>} Cost analysis data
     */
    async getCostAnalysis(crawlId = null, startDate = null, endDate = null) {
        try {
            const matchStage = {
                ...createCrawlMatch(crawlId),
                ...createDateRangeMatch(startDate, endDate)
            };

            const pipeline = buildCostAnalysisPipeline({ matchStage });
            const costAnalysis = await this.aggregate(pipeline);

            return {
                dailyCosts: costAnalysis,
                totalCost: costAnalysis.reduce((sum, day) => sum + day.totalCost, 0),
                totalRequests: costAnalysis.reduce((sum, day) => sum + day.totalRequests, 0)
            };
        } catch (error) {
            this.handleError('getCostAnalysis', error);
        }
    }

    /**
     * Get proxy usage for a specific URL
     * @param {string} url - The URL to get usage for
     * @returns {Promise<Array>} Proxy usage data for the URL
     */
    async getProxyUsageForUrl(url) {
        try {
            const pipeline = buildProxyPerformancePipeline({
                matchStage: { url },
                sortBy: 'lastUsed'
            });
            
            return await this.aggregate(pipeline);
        } catch (error) {
            this.handleError('getProxyUsageForUrl', error);
        }
    }

    /**
     * Cleanup old proxy usage records
     * @param {number} daysOld - Number of days to keep
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupOldRecords(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await this.deleteMany({
                lastUsed: { $lt: cutoffDate }
            });

            console.log(`Cleaned up ${result.deletedCount} old proxy usage records`);
            return result;
        } catch (error) {
            this.handleError('cleanupOldRecords', error);
        }
    }

    /**
     * Update crawl's proxy usage statistics
     * @param {string} crawlId - The crawl ID
     * @returns {Promise<void>}
     */
    async updateCrawlProxyStats(crawlId) {
        try {
            const summary = await ProxyUsage.getCrawlSummary(crawlId);
            
            await Crawl.findByIdAndUpdate(crawlId, {
                'proxyUsageStats.totalProxyRequests': summary.totalProxyRequests,
                'proxyUsageStats.uniqueProxiesUsed': summary.uniqueProxiesUsed,
                'proxyUsageStats.lastProxyUsed': summary.lastProxyUsed,
                'proxyUsageStats.proxyCostEstimate': summary.totalCost,
                'proxyUsageStats.averageProxySuccessRate': summary.averageSuccessRate
            });
        } catch (error) {
            this.handleError('updateCrawlProxyStats', error);
        }
    }

    /**
     * Get proxy usage summary for multiple crawls
     * @param {Array} crawlIds - Array of crawl IDs
     * @returns {Promise<Array>} Summary data for each crawl
     */
    async getMultipleCrawlSummaries(crawlIds) {
        try {
            const summaries = await Promise.all(
                crawlIds.map(async (crawlId) => {
                    const summary = await ProxyUsage.getCrawlSummary(crawlId);
                    return { crawlId, ...summary };
                })
            );
            
            return summaries;
        } catch (error) {
            this.handleError('getMultipleCrawlSummaries', error);
        }
    }
}

module.exports = new ProxyUsageService(); 