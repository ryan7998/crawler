/**
 * Shared aggregation pipeline utilities
 * Reduces duplication in MongoDB aggregation queries across services
 */

/**
 * Common aggregation stages for proxy usage statistics
 */
const proxyUsageStages = {
    /**
     * Group by proxy ID with common metrics
     */
    groupByProxy: {
        $group: {
            _id: '$proxyId',
            totalRequests: { $sum: '$totalRequests' },
            successCount: { $sum: '$successCount' },
            failureCount: { $sum: '$failureCount' },
            totalCost: { $sum: '$totalCost' },
            lastUsed: { $max: '$lastUsed' },
            location: { $first: '$proxyLocation' },
            averageResponseTime: { $avg: '$averageResponseTime' }
        }
    },

    /**
     * Project proxy performance metrics
     */
    projectProxyPerformance: {
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

    /**
     * Project proxy summary metrics
     */
    projectProxySummary: {
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

    /**
     * Sort by total requests descending
     */
    sortByRequests: {
        $sort: { totalRequests: -1 }
    },

    /**
     * Sort by last used descending
     */
    sortByLastUsed: {
        $sort: { lastUsed: -1 }
    },

    /**
     * Sort by success rate descending
     */
    sortBySuccessRate: {
        $sort: { successRate: -1 }
    }
};

/**
 * Common aggregation stages for cost analysis
 */
const costAnalysisStages = {
    /**
     * Group by date (year, month, day)
     */
    groupByDate: {
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

    /**
     * Project daily cost metrics
     */
    projectDailyCosts: {
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

    /**
     * Sort by date ascending
     */
    sortByDate: {
        $sort: { date: 1 }
    }
};

/**
 * Common aggregation stages for summary statistics
 */
const summaryStages = {
    /**
     * Group all documents for summary
     */
    groupAll: {
        $group: {
            _id: null,
            totalProxyRequests: { $sum: '$totalRequests' },
            uniqueProxiesUsed: { $addToSet: '$proxyId' },
            totalCost: { $sum: '$totalCost' },
            totalSuccessCount: { $sum: '$successCount' },
            totalFailureCount: { $sum: '$failureCount' },
            lastProxyUsed: { $max: '$lastUsed' }
        }
    },

    /**
     * Project summary metrics
     */
    projectSummary: {
        $project: {
            _id: 0,
            totalProxyRequests: 1,
            uniqueProxiesUsed: { $size: '$uniqueProxiesUsed' },
            totalCost: { $round: ['$totalCost', 4] },
            averageSuccessRate: {
                $cond: [
                    { $eq: ['$totalProxyRequests', 0] },
                    0,
                    { $round: [{ $multiply: [{ $divide: ['$totalSuccessCount', '$totalProxyRequests'] }, 100] }, 2] }
                ]
            },
            lastProxyUsed: 1
        }
    }
};

/**
 * Build aggregation pipeline for proxy performance
 * @param {Object} options - Pipeline options
 * @returns {Array} Aggregation pipeline
 */
function buildProxyPerformancePipeline(options = {}) {
    const {
        matchStage = {},
        limit = 10,
        sortBy = 'requests' // 'requests', 'successRate', 'lastUsed'
    } = options;

    const pipeline = [];

    // Add match stage if provided
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Add grouping and projection
    pipeline.push(proxyUsageStages.groupByProxy);
    pipeline.push(proxyUsageStages.projectProxyPerformance);

    // Add sorting
    switch (sortBy) {
        case 'successRate':
            pipeline.push(proxyUsageStages.sortBySuccessRate);
            break;
        case 'lastUsed':
            pipeline.push(proxyUsageStages.sortByLastUsed);
            break;
        default:
            pipeline.push(proxyUsageStages.sortByRequests);
    }

    // Add limit if specified
    if (limit) {
        pipeline.push({ $limit: limit });
    }

    return pipeline;
}

/**
 * Build aggregation pipeline for cost analysis
 * @param {Object} options - Pipeline options
 * @returns {Array} Aggregation pipeline
 */
function buildCostAnalysisPipeline(options = {}) {
    const {
        matchStage = {},
        groupBy = 'date' // 'date', 'proxy', 'crawl'
    } = options;

    const pipeline = [];

    // Add match stage if provided
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Add grouping based on type
    switch (groupBy) {
        case 'proxy':
            pipeline.push(proxyUsageStages.groupByProxy);
            pipeline.push(proxyUsageStages.projectProxySummary);
            pipeline.push(proxyUsageStages.sortByRequests);
            break;
        case 'crawl':
            pipeline.push({
                $group: {
                    _id: '$crawlId',
                    totalCost: { $sum: '$totalCost' },
                    totalRequests: { $sum: '$totalRequests' },
                    uniqueProxies: { $addToSet: '$proxyId' }
                }
            });
            pipeline.push({
                $project: {
                    crawlId: '$_id',
                    totalCost: { $round: ['$totalCost', 4] },
                    totalRequests: 1,
                    uniqueProxies: { $size: '$uniqueProxies' }
                }
            });
            pipeline.push({ $sort: { totalCost: -1 } });
            break;
        default: // date
            pipeline.push(costAnalysisStages.groupByDate);
            pipeline.push(costAnalysisStages.projectDailyCosts);
            pipeline.push(costAnalysisStages.sortByDate);
    }

    return pipeline;
}

/**
 * Build aggregation pipeline for summary statistics
 * @param {Object} options - Pipeline options
 * @returns {Array} Aggregation pipeline
 */
function buildSummaryPipeline(options = {}) {
    const {
        matchStage = {},
        includeDetails = false
    } = options;

    const pipeline = [];

    // Add match stage if provided
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Add summary grouping and projection
    pipeline.push(summaryStages.groupAll);
    pipeline.push(summaryStages.projectSummary);

    // Add additional details if requested
    if (includeDetails) {
        pipeline.push({
            $lookup: {
                from: 'crawls',
                localField: 'crawlId',
                foreignField: '_id',
                as: 'crawlDetails'
            }
        });
    }

    return pipeline;
}

/**
 * Create date range match stage
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} dateField - Date field name (default: 'lastUsed')
 * @returns {Object} Match stage
 */
function createDateRangeMatch(startDate, endDate, dateField = 'lastUsed') {
    const match = {};
    
    if (startDate) {
        match[dateField] = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
        match[dateField] = { ...match[dateField], $lte: new Date(endDate) };
    }
    
    return Object.keys(match).length > 0 ? match : {};
}

/**
 * Create crawl match stage
 * @param {string} crawlId - Crawl ID
 * @returns {Object} Match stage
 */
function createCrawlMatch(crawlId) {
    return crawlId ? { crawlId: crawlId } : {};
}

module.exports = {
    // Individual stages
    proxyUsageStages,
    costAnalysisStages,
    summaryStages,
    
    // Pipeline builders
    buildProxyPerformancePipeline,
    buildCostAnalysisPipeline,
    buildSummaryPipeline,
    
    // Utility functions
    createDateRangeMatch,
    createCrawlMatch
}; 