const express = require('express');
const router = express.Router();

// Test route to verify the server is working
router.get('/test', (req, res) => {
    console.log('🔍 Export test route hit');
    res.json({ 
        message: 'Export routes are working!', 
        timestamp: new Date().toISOString(),
        availableRoutes: [
            'GET /api/export/test',
            'GET /api/export/changes/:crawlId',
            'GET /api/export/csv/:crawlId',
            'GET /api/export/crawls',
            'POST /api/export/google-sheets/:crawlId',
            'POST /api/export/google-sheets/multiple',
            'POST /api/export/google-sheets/global'
        ]
    });
});

// Import services with error handling
let googleSheetsService, changeDetectionService;
try {
    // Use OAuth2 service instead of service account
    googleSheetsService = require('../services/googleSheetsOAuth2Service');
    changeDetectionService = require('../services/changeDetectionService');
} catch (error) {
    console.error('Error importing services:', error);
    // Create fallback services
    googleSheetsService = {
        exportCrawlWithChanges: async () => ({ error: 'Service not available' }),
        exportMultipleCrawls: async () => ({ error: 'Service not available' }),
        exportGlobalChanges: async () => ({ error: 'Service not available' })
    };
    changeDetectionService = {
        detectChanges: async () => ({ error: 'Service not available' }),
        prepareForGoogleSheets: () => []
    };
}

const Crawl = require('../models/Crawl');
const CrawlData = require('../models/CrawlData');

/**
 * Export multiple crawls to a single Google Sheet
 * POST /api/export/google-sheets/multiple
 */
router.post('/google-sheets/multiple', async (req, res) => {
    try {
        const { crawlIds, sheetTitle } = req.body;

        // Validate input
        if (!crawlIds || !Array.isArray(crawlIds) || crawlIds.length === 0) {
            return res.status(400).json({ message: 'Crawl IDs array is required' });
        }

        // Validate that all crawls exist
        const crawls = await Crawl.find({ _id: { $in: crawlIds } });
        if (crawls.length !== crawlIds.length) {
            return res.status(400).json({ message: 'One or more crawls not found' });
        }

        // Export multiple crawls
        const result = await googleSheetsService.exportMultipleCrawls(crawlIds, {
            sheetTitle
        });

        res.json(result);

    } catch (error) {
        console.error('Error exporting multiple crawls:', error);
        res.status(500).json({ 
            message: 'Error exporting multiple crawls', 
            error: error.message 
        });
    }
});

/**
 * Export all crawls with changes to a global Google Sheet
 * POST /api/export/google-sheets/global
 */
router.post('/google-sheets/global', async (req, res) => {
    try {
        const { 
            userId, 
            includeUnchanged = false, 
            sheetTitle, 
            limit = 100,
            statusFilter 
        } = req.body;

        // Export global changes
        const result = await googleSheetsService.exportGlobalChanges({
            userId,
            includeUnchanged,
            sheetTitle,
            limit,
            statusFilter
        });

        if (result.error) {
            return res.status(500).json({ message: result.error });
        }

        res.json(result);

    } catch (error) {
        console.error('Error exporting global changes:', error);
        res.status(500).json({ 
            message: 'Error exporting global changes', 
            error: error.message 
        });
    }
});

/**
 * Export crawl data with change tracking to Google Sheets
 * POST /api/export/google-sheets/:crawlId
 * 
 * By default, automatically compares the most recent run with the previous run of the same crawl.
 * Use compareWith parameter to compare with a specific different crawl.
 */
router.post('/google-sheets/:crawlId', async (req, res) => {
    try {
        const { crawlId } = req.params;
        const { 
            compareWith, 
            includeUnchanged = false, 
            sheetTitle, 
            updateExisting = false,
            existingSheetId 
        } = req.body;

        // Validate crawlId
        if (!crawlId) {
            return res.status(400).json({ message: 'Crawl ID is required' });
        }

        // Check if crawl exists
        const crawl = await Crawl.findById(crawlId);
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' });
        }

        // Export to Google Sheets
        const result = await googleSheetsService.exportCrawlWithChanges(crawlId, {
            compareWith,
            includeUnchanged,
            sheetTitle,
            updateExisting,
            existingSheetId
        });

        if (result.error) {
            return res.status(500).json({ message: result.error });
        }

        res.json(result);

    } catch (error) {
        console.error('Error exporting to Google Sheets:', error);
        res.status(500).json({ 
            message: 'Error exporting to Google Sheets', 
            error: error.message 
        });
    }
});

/**
 * Get change analysis for a crawl
 * GET /api/export/changes/:crawlId
 * 
 * By default, automatically compares the most recent run with the previous run of the same crawl.
 * Use compareWith query parameter to compare with a specific different crawl.
 */
router.get('/changes/:crawlId', async (req, res) => {
    console.log('🔍 Changes route hit:', req.params, req.query);
    try {
        const { crawlId } = req.params;
        const { compareWith } = req.query;
        console.log('compareWith: ', compareWith);

        // Validate crawlId
        if (!crawlId) {
            return res.status(400).json({ message: 'Crawl ID is required' });
        }

        // Get change analysis
        const changeAnalysis = await changeDetectionService.detectChanges(crawlId, compareWith);
        if (changeAnalysis.error) {
            return res.status(500).json({ message: changeAnalysis.error });
        }

        res.json(changeAnalysis);

    } catch (error) {
        console.error('Error getting change analysis:', error);
        res.status(500).json({ 
            message: 'Error getting change analysis', 
            error: error.message 
        });
    }
});

/**
 * Export multiple crawls to a single Google Sheet
 * POST /api/export/google-sheets/multiple
 */
router.post('/google-sheets/multiple', async (req, res) => {
    try {
        const { crawlIds, sheetTitle } = req.body;

        // Validate input
        if (!crawlIds || !Array.isArray(crawlIds) || crawlIds.length === 0) {
            return res.status(400).json({ message: 'Crawl IDs array is required' });
        }

        // Validate that all crawls exist
        const crawls = await Crawl.find({ _id: { $in: crawlIds } });
        if (crawls.length !== crawlIds.length) {
            return res.status(400).json({ message: 'One or more crawls not found' });
        }

        // Export multiple crawls
        const result = await googleSheetsService.exportMultipleCrawls(crawlIds, {
            sheetTitle
        });

        res.json(result);

    } catch (error) {
        console.error('Error exporting multiple crawls:', error);
        res.status(500).json({ 
            message: 'Error exporting multiple crawls', 
            error: error.message 
        });
    }
});

/**
 * Export all crawls with changes to a global Google Sheet
 * POST /api/export/google-sheets/global
 */
router.post('/google-sheets/global', async (req, res) => {
    try {
        const { 
            userId, 
            includeUnchanged = false, 
            sheetTitle, 
            limit = 100,
            statusFilter 
        } = req.body;

        // Export global changes
        const result = await googleSheetsService.exportGlobalChanges({
            userId,
            includeUnchanged,
            sheetTitle,
            limit,
            statusFilter
        });

        if (result.error) {
            return res.status(500).json({ message: result.error });
        }

        res.json(result);

    } catch (error) {
        console.error('Error exporting global changes:', error);
        res.status(500).json({ 
            message: 'Error exporting global changes', 
            error: error.message 
        });
    }
});

/**
 * Get available crawls for comparison
 * GET /api/export/crawls
 */
router.get('/crawls', async (req, res) => {
    try {
        const { userId, limit = 50 } = req.query;

        const query = {};
        if (userId) {
            query.userId = userId;
        }

        const crawls = await Crawl.find(query)
            .select('_id title status startTime endTime createdAt')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            crawls,
            total: crawls.length
        });

    } catch (error) {
        console.error('Error getting crawls:', error);
        res.status(500).json({ 
            message: 'Error getting crawls', 
            error: error.message 
        });
    }
});

/**
 * Export crawl data to CSV with change tracking
 * GET /api/export/csv/:crawlId
 */
router.get('/csv/:crawlId', async (req, res) => {
    try {
        const { crawlId } = req.params;
        const { compareWith, includeUnchanged = false } = req.query;

        // Validate crawlId
        if (!crawlId) {
            return res.status(400).json({ message: 'Crawl ID is required' });
        }

        // Check if crawl exists
        const crawl = await Crawl.findById(crawlId);
        if (!crawl) {
            return res.status(404).json({ message: 'Crawl not found' });
        }

        // Get change analysis
        const changeAnalysis = await changeDetectionService.detectChanges(crawlId, compareWith);
        
        // Prepare CSV data
        const csvData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
        
        // Filter out unchanged rows if requested
        let filteredData = csvData;
        if (!includeUnchanged) {
            filteredData = csvData.filter(row => 
                row.length > 4 && row[4] !== 'Unchanged'
            );
        }

        // Convert to CSV format
        const csv = convertToCSV(filteredData);

        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="crawl-changes-${crawlId}-${new Date().toISOString().split('T')[0]}.csv"`);
        
        res.send(csv);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ 
            message: 'Error exporting CSV', 
            error: error.message 
        });
    }
});

/**
 * Get Google Drive storage quota for the service account
 * GET /api/export/google-storage
 */
router.get('/google-storage', async (req, res) => {
    try {
        const quota = await googleSheetsService.getDriveStorageQuota();
        res.json(quota);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Convert array data to CSV format
 */
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    return data.map(row => 
        row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const cellStr = String(cell || '');
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(',')
    ).join('\n');
}

module.exports = router; 