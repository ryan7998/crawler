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

            // DEBUG LOGGING
            console.log('DEBUG: allCrawlData.length =', allCrawlData.length);
            console.log('DEBUG: allCrawlData URLs =', allCrawlData.map(d => d.url));

            if (allCrawlData.length === 0) {
                throw new Error('No crawl data found for this crawl');
            }

            // Group by URL and get the latest data for each URL (most recent run)
            const currentDataByUrl = this.groupByUrlAndGetLatest(allCrawlData);
            console.log('DEBUG: currentDataByUrl keys =', Object.keys(currentDataByUrl));

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
            console.log('DEBUG: previousDataByUrl keys =', Object.keys(previousDataByUrl));

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
    prepareForGoogleSheets(changes, crawlTitle = '', comparisonSelectors = null) {
        const rows = [];
        // New headers: Crawl Title, Title, URL, Suite Number, Change Type, Crawled On
        rows.push([
            'Crawl Title',
            'Title',
            'URL',
            'Suite Number',
            'Change Type',
            'Crawled On'
        ]);

        // Helper to add a row
        const addRow = (row) => rows.push([crawlTitle, ...row]);

        // Helper to get title (case-insensitive)
        const getTitle = (data) => {
            if (!data) return '';
            return data.title || data.Title || '';
        };

        // Helper to format date as 'YYYY-MM-DD HH:mm:ss'
        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const pad = n => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        };

        // Helper to extract values from container data based on selected child selectors
        const extractComparisonValues = (data) => {
            if (!data || typeof data !== 'object') return [];
            // Find all container fields (e.g., vacancy_data, suite_data, available_units, etc.)
            const containerKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
            let results = [];
            for (const key of containerKeys) {
                const arr = data[key];
                if (!Array.isArray(arr)) continue;
                // Determine which child fields to use for comparison
                let childNames = null;
                if (comparisonSelectors && comparisonSelectors[key]) {
                    childNames = comparisonSelectors[key];
                }
                // If not specified, default to suite_number, suite, unit_suite, unit
                if (!childNames || childNames.length === 0) {
                    childNames = ['suite_number', 'suite', 'unit_suite', 'unit'];
                }
                arr.forEach(row => {
                    for (const childName of childNames) {
                        if (row[childName]) {
                            results.push(row[childName]);
                        }
                    }
                });
            }
            return results;
        };

        // Helper to build a map of value -> row for lookup
        const buildComparisonMap = (data) => {
            if (!data || typeof data !== 'object') return {};
            const containerKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
            const map = {};
            for (const key of containerKeys) {
                const arr = data[key];
                if (!Array.isArray(arr)) continue;
                let childNames = null;
                if (comparisonSelectors && comparisonSelectors[key]) {
                    childNames = comparisonSelectors[key];
                }
                if (!childNames || childNames.length === 0) {
                    childNames = ['suite_number', 'suite', 'unit_suite', 'unit'];
                }
                arr.forEach(row => {
                    for (const childName of childNames) {
                        if (row[childName]) {
                            map[row[childName]] = row;
                        }
                    }
                });
            }
            return map;
        };

        // For each URL, compare values in current and previous data
        const processUrlComparisons = (url, currentData, previousData, currentDate, previousDate, title) => {
            const currentVals = extractComparisonValues(currentData);
            const previousVals = extractComparisonValues(previousData);
            const currentMap = buildComparisonMap(currentData);
            const previousMap = buildComparisonMap(previousData);
            const allVals = new Set([...currentVals, ...previousVals]);
            allVals.forEach(val => {
                let changeType = '';
                let crawledOn = '';
                if (currentVals.includes(val) && !previousVals.includes(val)) {
                    changeType = 'New';
                    crawledOn = formatDate(currentDate);
                } else if (!currentVals.includes(val) && previousVals.includes(val)) {
                    changeType = 'Removed';
                    crawledOn = formatDate(previousDate); // fallback to previousDate for removed
                } else {
                    changeType = 'Unchanged';
                    crawledOn = formatDate(currentDate);
                }
                addRow([
                    title,
                    url,
                    val,
                    changeType,
                    crawledOn
                ]);
            });
        };

        // New URLs
        changes.newUrls.forEach(item => {
            processUrlComparisons(
                item.url,
                item.currentData,
                null,
                item.currentDate,
                null,
                getTitle(item.currentData)
            );
        });

        // Removed URLs
        changes.removedUrls.forEach(item => {
            processUrlComparisons(
                item.url,
                null,
                item.previousData,
                null,
                item.previousDate,
                getTitle(item.previousData)
            );
        });

        // Changed URLs
        changes.changedUrls.forEach(item => {
            processUrlComparisons(
                item.url,
                item.currentData,
                item.previousData,
                item.currentDate,
                item.previousDate,
                getTitle(item.currentData) || getTitle(item.previousData)
            );
        });

        // Unchanged URLs (optional, can be omitted if not needed)
        changes.unchangedUrls.forEach(item => {
            processUrlComparisons(
                item.url,
                item.data,
                item.data,
                item.date,
                item.date,
                getTitle(item.data)
            );
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
        // Group by runId
        const runs = {};
        allCrawlData.forEach(entry => {
            if (!entry.runId) return; // skip if missing
            if (!runs[entry.runId]) runs[entry.runId] = [];
            runs[entry.runId].push(entry);
        });
        // Sort runIds by latest createdAt in each run (descending)
        const sortedRunIds = Object.keys(runs).sort((a, b) => {
            const aMax = Math.max(...runs[a].map(e => new Date(e.createdAt).getTime()));
            const bMax = Math.max(...runs[b].map(e => new Date(e.createdAt).getTime()));
            return bMax - aMax;
        });
        // The first runId is the latest run, the second is the previous run
        if (sortedRunIds.length < 2) return [];
        return runs[sortedRunIds[1]];
    }
}

module.exports = new ChangeDetectionService(); 