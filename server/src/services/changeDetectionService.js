const CrawlData = require('../models/CrawlData');
const Crawl = require('../models/Crawl');

class ChangeDetectionService {
    /**
     * Compare current crawl data with previous crawl data
     * @param {string} crawlId - The crawl ID to analyze
     * @param {string} compareWith - Optional: specific crawl ID to compare with (defaults to previous run)
     * @returns {Object} Change analysis results
     */
    async detectChanges(crawlId, compareWith = null) {
        try {
            // Get current crawl
            const currentCrawl = await Crawl.findById(crawlId);
            if (!currentCrawl) {
                throw new Error('Crawl not found');
            }

            // Get all crawl data for this crawl, sorted by creation time (newest first)
            const allCrawlData = await CrawlData.find({ crawlId })
                .sort({ createdAt: -1 });

            if (allCrawlData.length === 0) {
                throw new Error('No crawl data found for this crawl');
            }

            // Group by URL and get the latest data for each URL (most recent run)
            const currentDataByUrl = this.groupByUrlAndGetLatest(allCrawlData);

            // Get previous crawl data for comparison
            let previousDataByUrl = {};
            if (compareWith) {
                // Compare with specific crawl (manual selection)
                const previousCrawlData = await CrawlData.find({ crawlId: compareWith })
                    .sort({ createdAt: -1 });
                previousDataByUrl = this.groupByUrlAndGetLatest(previousCrawlData);
            } else {
                // Automatically compare with the previous run of the same crawl
                const previousRunData = await this.getPreviousRunData(crawlId, allCrawlData);
                if (previousRunData.length > 0) {
                    previousDataByUrl = this.groupByUrlAndGetLatest(previousRunData);
                }
            }

            // Analyze changes
            const changes = this.analyzeChanges(currentDataByUrl, previousDataByUrl);

            return {
                crawlId,
                crawlTitle: currentCrawl.title,
                totalUrls: Object.keys(currentDataByUrl).length,
                changedUrls: changes.changedUrls.length,
                newUrls: changes.newUrls.length,
                removedUrls: changes.removedUrls.length,
                unchangedUrls: changes.unchangedUrls.length,
                changes: changes,
                summary: this.generateSummary(changes),
                comparisonInfo: {
                    currentRunDate: allCrawlData[0]?.createdAt,
                    previousRunDate: Object.keys(previousDataByUrl).length > 0 ? 
                        Math.max(...Object.values(previousDataByUrl).map(d => d.createdAt)) : null,
                    hasPreviousRun: Object.keys(previousDataByUrl).length > 0
                }
            };

        } catch (error) {
            console.error('Error detecting changes:', error);
            throw error;
        }
    }

    /**
     * Group crawl data by URL and get the latest entry for each URL
     */
    groupByUrlAndGetLatest(crawlData) {
        const grouped = {};
        
        crawlData.forEach(entry => {
            const url = entry.url;
            if (!grouped[url] || entry.createdAt > grouped[url].createdAt) {
                grouped[url] = entry;
            }
        });

        return grouped;
    }

    /**
     * Analyze changes between current and previous data
     */
    analyzeChanges(currentData, previousData) {
        const changes = {
            changedUrls: [],
            newUrls: [],
            removedUrls: [],
            unchangedUrls: [],
            detailedChanges: []
        };

        const allUrls = new Set([
            ...Object.keys(currentData),
            ...Object.keys(previousData)
        ]);

        allUrls.forEach(url => {
            const current = currentData[url];
            const previous = previousData[url];

            if (!current) {
                // URL was removed
                changes.removedUrls.push({
                    url,
                    previousData: previous?.data,
                    previousStatus: previous?.status,
                    previousDate: previous?.createdAt
                });
            } else if (!previous) {
                // URL is new
                changes.newUrls.push({
                    url,
                    currentData: current.data,
                    currentStatus: current.status,
                    currentDate: current.createdAt
                });
            } else {
                // URL exists in both - check for changes
                const fieldChanges = this.compareData(current.data, previous.data);
                
                if (fieldChanges.length > 0 || current.status !== previous.status) {
                    changes.changedUrls.push({
                        url,
                        currentData: current.data,
                        previousData: previous.data,
                        currentStatus: current.status,
                        previousStatus: previous.status,
                        currentDate: current.createdAt,
                        previousDate: previous.createdAt,
                        fieldChanges
                    });
                } else {
                    changes.unchangedUrls.push({
                        url,
                        data: current.data,
                        status: current.status,
                        date: current.createdAt
                    });
                }
            }
        });

        return changes;
    }

    /**
     * Compare two data objects and return field-level changes
     */
    compareData(currentData, previousData) {
        const changes = [];
        
        if (!currentData || !previousData) {
            return changes;
        }

        // Get all unique keys from both objects
        const allKeys = new Set([
            ...Object.keys(currentData),
            ...Object.keys(previousData)
        ]);

        allKeys.forEach(key => {
            const currentValue = currentData[key];
            const previousValue = previousData[key];

            // Handle different data types
            if (this.hasValueChanged(currentValue, previousValue)) {
                changes.push({
                    field: key,
                    currentValue: this.formatValue(currentValue),
                    previousValue: this.formatValue(previousValue),
                    changeType: this.getChangeType(currentValue, previousValue)
                });
            }
        });

        return changes;
    }

    /**
     * Check if two values are different
     */
    hasValueChanged(current, previous) {
        // Handle null/undefined cases
        if (current === null && previous === null) return false;
        if (current === undefined && previous === undefined) return false;
        if (current === null || current === undefined) return true;
        if (previous === null || previous === undefined) return true;

        // Handle arrays
        if (Array.isArray(current) && Array.isArray(previous)) {
            if (current.length !== previous.length) return true;
            return current.some((item, index) => this.hasValueChanged(item, previous[index]));
        }

        // Handle objects
        if (typeof current === 'object' && typeof previous === 'object') {
            const currentKeys = Object.keys(current);
            const previousKeys = Object.keys(previous);
            
            if (currentKeys.length !== previousKeys.length) return true;
            
            return currentKeys.some(key => 
                this.hasValueChanged(current[key], previous[key])
            );
        }

        // Handle primitive values
        return current !== previous;
    }

    /**
     * Format value for display
     */
    formatValue(value) {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) {
            // Handle arrays of objects specially
            if (value.length > 0 && typeof value[0] === 'object') {
                return value.map(item => this.formatValue(item)).join('; ');
            }
            return value.join('; ');
        }
        if (typeof value === 'object') {
            // Handle nested objects more gracefully
            try {
                // If it's a simple object with primitive values, format it nicely
                const keys = Object.keys(value);
                if (keys.length <= 5) { // Only format small objects nicely
                    const formatted = keys.map(key => {
                        const val = value[key];
                        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                            return `${key}: ${val}`;
                        } else if (Array.isArray(val)) {
                            return `${key}: [${val.join(', ')}]`;
                        } else {
                            return `${key}: ${JSON.stringify(val)}`;
                        }
                    }).join(' | ');
                    return formatted;
                } else {
                    // For larger objects, use JSON but limit length
                    const jsonStr = JSON.stringify(value);
                    return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
                }
            } catch (error) {
                return '[Complex Object]';
            }
        }
        return String(value);
    }

    /**
     * Determine the type of change
     */
    getChangeType(current, previous) {
        if (current === null || current === undefined) return 'removed';
        if (previous === null || previous === undefined) return 'new';
        return 'changed';
    }

    /**
     * Generate a human-readable summary
     */
    generateSummary(changes) {
        const { changedUrls, newUrls, removedUrls, unchangedUrls } = changes;
        
        return {
            totalUrls: changedUrls.length + newUrls.length + removedUrls.length + unchangedUrls.length,
            changedCount: changedUrls.length,
            newCount: newUrls.length,
            removedCount: removedUrls.length,
            unchangedCount: unchangedUrls.length,
            changePercentage: ((changedUrls.length + newUrls.length + removedUrls.length) / 
                (changedUrls.length + newUrls.length + removedUrls.length + unchangedUrls.length) * 100).toFixed(1)
        };
    }

    /**
     * Prepare data for Google Sheets export
     */
    prepareForGoogleSheets(changes) {
        const rows = [];
        
        // Add headers
        rows.push([
            'URL',
            'Field',
            'Current Value',
            'Previous Value',
            'Change Status',
            'Change Type',
            'Last Updated',
            'Previous Date'
        ]);

        // Process new URLs
        changes.newUrls.forEach(item => {
            if (item.currentData) {
                Object.entries(item.currentData).forEach(([field, value]) => {
                    rows.push([
                        item.url,
                        field,
                        this.formatValue(value),
                        '',
                        'New',
                        'new',
                        item.currentDate,
                        ''
                    ]);
                });
            }
        });

        // Process removed URLs
        changes.removedUrls.forEach(item => {
            if (item.previousData) {
                Object.entries(item.previousData).forEach(([field, value]) => {
                    rows.push([
                        item.url,
                        field,
                        '',
                        this.formatValue(value),
                        'Removed',
                        'removed',
                        '',
                        item.previousDate
                    ]);
                });
            }
        });

        // Process changed URLs - show as two separate rows: removed and new
        changes.changedUrls.forEach(item => {
            item.fieldChanges.forEach(change => {
                // First row: Previous value as "Removed" (highlighted in red)
                rows.push([
                    item.url,
                    change.field,
                    '', // Current value empty for removed row
                    change.previousValue,
                    'Removed',
                    'removed',
                    '', // Current date empty for removed row
                    item.previousDate
                ]);
                
                // Second row: Current value as "New" (highlighted in green)
                rows.push([
                    item.url,
                    change.field,
                    change.currentValue,
                    '', // Previous value empty for new row
                    'New',
                    'new',
                    item.currentDate,
                    '' // Previous date empty for new row
                ]);
            });
        });

        // Process unchanged URLs (optional - can be filtered out)
        changes.unchangedUrls.forEach(item => {
            if (item.data) {
                Object.entries(item.data).forEach(([field, value]) => {
                    rows.push([
                        item.url,
                        field,
                        this.formatValue(value),
                        this.formatValue(value),
                        'Unchanged',
                        'unchanged',
                        item.date,
                        item.date
                    ]);
                });
            }
        });

        return rows;
    }

    /**
     * Get data from the previous run of the same crawl
     * @param {string} crawlId - The crawl ID
     * @param {Array} allCrawlData - All crawl data sorted by createdAt desc
     * @returns {Array} Previous run data
     */
    async getPreviousRunData(crawlId, allCrawlData) {
        if (allCrawlData.length === 0) {
            return [];
        }

        // Find the most recent data entry
        const mostRecentEntry = allCrawlData[0];
        const mostRecentTime = mostRecentEntry.createdAt;

        // Find all data entries that are older than the most recent entry
        // This represents the previous run(s)
        const previousRunData = allCrawlData.filter(entry => 
            entry.createdAt < mostRecentTime
        );

        // If we have previous run data, return it
        if (previousRunData.length > 0) {
            return previousRunData;
        }

        // If no previous run data found, return empty array
        return [];
    }
}

module.exports = new ChangeDetectionService(); 