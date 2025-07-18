// Try to import googleapis, but provide fallback if not available
let google;
try {
    google = require('googleapis').google;
} catch (error) {
    console.warn('Google APIs not available. Google Sheets export will be disabled.');
    google = null;
}

const changeDetectionService = require('./changeDetectionService');
const fs = require('fs');
const path = require('path');

class GoogleSheetsOAuth2Service {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.drive = null;
        this.credentials = null;
        this.tokens = null;
        this.initializeAuth();
    }

    /**
     * Initialize OAuth2 authentication
     */
    async initializeAuth() {
        try {
            if (!google) {
                console.warn('Google APIs not available. Google Sheets export disabled.');
                return;
            }

            // Load OAuth2 credentials
            const credentialsPath = process.env.GOOGLE_OAUTH2_CREDENTIALS || './oauth2-credentials.json';
            if (!fs.existsSync(credentialsPath)) {
                console.warn('OAuth2 credentials file not found. Google Sheets export disabled.');
                return;
            }

            this.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            
            // Check if we have stored tokens
            const tokensPath = './oauth2-tokens.json';
            if (fs.existsSync(tokensPath)) {
                this.tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
                console.log('Found stored OAuth2 tokens');
            }

            // Create OAuth2 client
            const { client_secret, client_id, redirect_uris } = this.credentials.installed;
            
            // Use environment variable for redirect URI, fallback to the first one from credentials
            const redirectUri = process.env.GOOGLE_OAUTH2_REDIRECT_URI || redirect_uris[0];
            
            this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

            // Set credentials if we have tokens
            if (this.tokens) {
                this.oAuth2Client.setCredentials(this.tokens);
                this.auth = this.oAuth2Client;
                this.sheets = google.sheets({ version: 'v4', auth: this.auth });
                this.drive = google.drive({ version: 'v3', auth: this.auth });
                console.log('OAuth2 authentication initialized with stored tokens');
            } else {
                console.log('OAuth2 authentication initialized. Run getAuthUrl() to get authorization URL');
            }

        } catch (error) {
            console.error('Error initializing OAuth2 auth:', error);
        }
    }

    /**
     * Get authorization URL for OAuth2 flow
     */
    getAuthUrl() {
        if (!this.oAuth2Client) {
            throw new Error('OAuth2 client not initialized');
        }

        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ];

        // Use environment variable for redirect URI, fallback to localhost for development
        const redirectUri = process.env.GOOGLE_OAUTH2_REDIRECT_URI || 'http://localhost';

        return this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            redirect_uri: redirectUri
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oAuth2Client.getToken(code);
            this.tokens = tokens;
            this.oAuth2Client.setCredentials(tokens);
            
            // Store tokens for future use
            fs.writeFileSync('./oauth2-tokens.json', JSON.stringify(tokens));
            
            // Initialize APIs with new tokens
            this.auth = this.oAuth2Client;
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            
            console.log('OAuth2 tokens obtained and stored');
            return tokens;
        } catch (error) {
            console.error('Error getting tokens:', error);
            throw error;
        }
    }

    /**
     * Check if authentication is ready
     */
    isAuthenticated() {
        return this.auth && this.sheets && this.drive;
    }

    /**
     * Export crawl data with change tracking to Google Sheets
     */
    async exportCrawlWithChanges(crawlId, options = {}) {
        try {
            if (!this.isAuthenticated()) {
                return {
                    error: 'OAuth2 authentication required. Please run the authentication flow first.'
                };
            }

            const {
                compareWith = null,
                includeUnchanged = false,
                sheetTitle = null,
                updateExisting = false,
                existingSheetId = null,
                folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null
            } = options;

            // Detect changes
            const changeAnalysis = await changeDetectionService.detectChanges(crawlId, compareWith);
            
            // Prepare data for Google Sheets
            const sheetData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
            
            // Filter out unchanged rows if requested
            let filteredData = sheetData;
            if (!includeUnchanged) {
                filteredData = sheetData.filter(row => 
                    row.length > 4 && row[4] !== 'Unchanged'
                );
            }

            // Generate sheet title with comparison info
            let finalSheetTitle = sheetTitle;
            if (!finalSheetTitle) {
                if (changeAnalysis.comparisonInfo?.hasPreviousRun) {
                    finalSheetTitle = `Crawl Changes - ${changeAnalysis.crawlTitle} (vs Previous Run)`;
                } else {
                    finalSheetTitle = `Crawl Data - ${changeAnalysis.crawlTitle} (No Previous Run)`;
                }
            }

            // Create or update Google Sheet
            let spreadsheetId = existingSheetId;
            if (!spreadsheetId || !updateExisting) {
                spreadsheetId = await this.createNewSheet(finalSheetTitle, folderId);
            }

            // Write data to sheet
            await this.writeDataToSheet(spreadsheetId, filteredData);

            // Apply formatting
            await this.applyFormatting(spreadsheetId, changeAnalysis);

            // Share the sheet with the user
            await this.shareSheet(spreadsheetId);

            // Get sheet URL
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

            return {
                success: true,
                spreadsheetId,
                sheetUrl,
                changeAnalysis,
                rowCount: filteredData.length - 1, // Exclude header
                message: 'Crawl data exported successfully with change tracking'
            };

        } catch (error) {
            console.error('Error exporting to Google Sheets:', error);
            return {
                error: `Error exporting to Google Sheets: ${error.message}`
            };
        }
    }

    /**
     * Create a new Google Sheet
     */
    async createNewSheet(title, folderId = null) {
        try {
            if (!this.sheets) {
                throw new Error('Google Sheets API not initialized');
            }

            const response = await this.sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: title || `Crawl Data - ${new Date().toISOString().split('T')[0]}`
                    },
                    sheets: [
                        {
                            properties: {
                                title: 'Change Tracking',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 10
                                }
                            }
                        }
                    ]
                }
            });

            const spreadsheetId = response.data.spreadsheetId;
            console.log('Sheet created with OAuth2:', spreadsheetId);

            // If a folder ID is provided, move the file to that folder
            if (folderId) {
                try {
                    await this.drive.files.update({
                        fileId: spreadsheetId,
                        addParents: folderId,
                        removeParents: 'root',
                        fields: 'id, parents'
                    });
                    console.log(`Sheet moved to folder: ${folderId}`);
                } catch (moveError) {
                    console.warn('Could not move sheet to folder:', moveError.message);
                    console.log('Sheet created in root Drive instead');
                }
            }

            return spreadsheetId;
        } catch (error) {
            console.error('Error creating Google Sheet:', error);
            throw error;
        }
    }

    /**
     * Write data to Google Sheet
     */
    async writeDataToSheet(spreadsheetId, data) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'A1',
                valueInputOption: 'RAW',
                requestBody: { values: data }
            });

            console.log(`Wrote ${data.length} rows to Google Sheet`);
        } catch (error) {
            console.error('Error writing data to Google Sheet:', error);
            throw error;
        }
    }

    /**
     * Apply formatting to the Google Sheet
     */
    async applyFormatting(spreadsheetId, changeAnalysis) {
        try {
            // First, get the sheet metadata to get the correct sheet ID and name
            const sheetMetadata = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'sheets.properties'
            });

            const sheetId = sheetMetadata.data.sheets[0].properties.sheetId;
            const sheetName = sheetMetadata.data.sheets[0].properties.title;

            const requests = [];

            // Header formatting
            requests.push({
                repeatCell: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                            textFormat: {
                                bold: true,
                                foregroundColor: { red: 1, green: 1, blue: 1 }
                            }
                        }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)'
                }
            });

            // Auto-resize columns
            requests.push({
                autoResizeDimensions: {
                    dimensions: {
                        sheetId: sheetId,
                        dimension: 'COLUMNS',
                        startIndex: 0,
                        endIndex: 8
                    }
                }
            });

            // Apply conditional formatting for change status - Green for New
            requests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId: sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 4,
                            endColumnIndex: 5
                        }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'New' }]
                            },
                            format: {
                                backgroundColor: { red: 0.8, green: 1, blue: 0.8 }
                            }
                        }
                    }
                }
            });

            // Red for Removed
            requests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{
                            sheetId: sheetId,
                            startRowIndex: 1,
                            startColumnIndex: 4,
                            endColumnIndex: 5
                        }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'Removed' }]
                            },
                            format: {
                                backgroundColor: { red: 1, green: 0.8, blue: 0.8 }
                            }
                        }
                    }
                }
            });

            // Add summary sheet
            await this.addSummarySheet(spreadsheetId, changeAnalysis);

            // Apply all formatting requests
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });

            console.log('Applied formatting to Google Sheet');
        } catch (error) {
            console.error('Error applying formatting:', error);
            // Don't throw error for formatting failures
        }
    }

    /**
     * Add a summary sheet with change statistics
     */
    async addSummarySheet(spreadsheetId, changeAnalysis) {
        try {
            // Create summary sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Summary'
                            }
                        }
                    }]
                }
            });

            // Prepare summary data
            const summaryData = [
                ['Crawl Change Summary'],
                [''],
                ['Crawl Title', changeAnalysis.crawlTitle],
                ['Crawl ID', changeAnalysis.crawlId],
                ['Export Date', new Date().toISOString()],
                [''],
                ['Comparison Information'],
                ['Comparison Type', changeAnalysis.comparisonInfo?.hasPreviousRun ? 'Most Recent vs Previous Run' : 'No Previous Run Available'],
                ['Current Run Date', changeAnalysis.comparisonInfo?.currentRunDate ? new Date(changeAnalysis.comparisonInfo.currentRunDate).toLocaleString() : 'N/A'],
                ['Previous Run Date', changeAnalysis.comparisonInfo?.previousRunDate ? new Date(changeAnalysis.comparisonInfo.previousRunDate).toLocaleString() : 'N/A'],
                [''],
                ['Statistics'],
                ['Total URLs', changeAnalysis.totalUrls],
                ['Changed URLs', changeAnalysis.changedUrls],
                ['New URLs', changeAnalysis.newUrls],
                ['Removed URLs', changeAnalysis.removedUrls],
                ['Unchanged URLs', changeAnalysis.unchangedUrls]
            ];

            // Write summary data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Summary!A1',
                valueInputOption: 'RAW',
                requestBody: { values: summaryData }
            });

            console.log('Added summary sheet');
        } catch (error) {
            console.error('Error adding summary sheet:', error);
        }
    }

    /**
     * Share the sheet with the user
     */
    async shareSheet(spreadsheetId) {
        try {
            if (!this.drive) {
                console.warn('Drive API not available, skipping sheet sharing');
                return;
            }

            const userEmail = process.env.GOOGLE_SHARE_EMAIL;
            if (!userEmail) {
                console.log('No GOOGLE_SHARE_EMAIL set, skipping sheet sharing');
                return;
            }

            await this.drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: userEmail
                },
                sendNotificationEmail: false
            });

            console.log(`Sheet shared with ${userEmail}`);
        } catch (error) {
            console.warn('Could not share sheet:', error.message);
        }
    }

    /**
     * Export multiple crawls to a single Google Sheet
     */
    async exportMultipleCrawls(crawlIds, options = {}) {
        try {
            if (!this.isAuthenticated()) {
                return {
                    error: 'OAuth2 authentication required. Please run the authentication flow first.'
                };
            }

            const { 
                sheetTitle,
                folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null
            } = options;
            const finalSheetTitle = sheetTitle || `Multiple Crawls - ${new Date().toISOString().split('T')[0]}`;

            // Create a new sheet
            const spreadsheetId = await this.createNewSheet(finalSheetTitle, folderId);

            // Get data for all crawls
            const allData = [];
            let currentRow = 1;

            for (const crawlId of crawlIds) {
                const changeAnalysis = await changeDetectionService.detectChanges(crawlId);
                const crawlData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
                
                // Add crawl header
                allData.push([`Crawl: ${changeAnalysis.crawlTitle}`]);
                allData.push(['']); // Empty row
                
                // Add data rows
                crawlData.forEach(row => {
                    allData.push(row);
                });
                
                allData.push(['']); // Empty row between crawls
                allData.push(['']); // Another empty row
            }

            // Write all data to sheet
            await this.writeDataToSheet(spreadsheetId, allData);

            // Apply formatting
            await this.applyMultiCrawlFormatting(spreadsheetId);

            // Share the sheet
            await this.shareSheet(spreadsheetId);

            const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

            return {
                success: true,
                spreadsheetId,
                sheetUrl,
                rowCount: allData.length - 1,
                message: 'Multiple crawls exported successfully'
            };

        } catch (error) {
            console.error('Error exporting multiple crawls:', error);
            return {
                error: `Error exporting multiple crawls: ${error.message}`
            };
        }
    }

    /**
     * Export global changes from all crawls
     */
    async exportGlobalChanges(options = {}) {
        try {
            if (!this.isAuthenticated()) {
                return {
                    error: 'OAuth2 authentication required. Please run the authentication flow first.'
                };
            }

            const { 
                userId, 
                includeUnchanged = false, 
                sheetTitle, 
                limit = 100,
                statusFilter,
                folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null
            } = options;

            const Crawl = require('../models/Crawl');
            const CrawlData = require('../models/CrawlData');

            // Get all crawls
            let query = {};
            if (userId) {
                query.userId = userId;
            }
            if (statusFilter) {
                query.status = statusFilter;
            }

            const crawls = await Crawl.find(query).limit(limit).sort({ createdAt: -1 });

            if (crawls.length === 0) {
                return {
                    error: 'No crawls found matching the criteria'
                };
            }

            // Use the fixed Google Sheet ID from env, or create a new one if not set
            let spreadsheetId = process.env.GOOGLE_GLOBAL_EXPORT_SHEET_ID;
            if (!spreadsheetId) {
                const finalSheetTitle = sheetTitle || `Global Crawl Changes - ${new Date().toISOString().split('T')[0]}`;
                spreadsheetId = await this.createNewSheet(finalSheetTitle, folderId);
            }

            // Collect all changes from all crawls
            const allChanges = [];
            const summaryData = {
                totalCrawls: crawls.length,
                totalChanges: 0,
                totalNew: 0,
                totalRemoved: 0,
                totalUnchanged: 0,
                crawlBreakdown: []
            };

            for (const crawl of crawls) {
                const changeAnalysis = await changeDetectionService.detectChanges(crawl._id.toString());
                
                // Check if we have any changes data
                if (changeAnalysis.changes && (
                    changeAnalysis.changes.newUrls.length > 0 ||
                    changeAnalysis.changes.removedUrls.length > 0 ||
                    changeAnalysis.changes.changedUrls.length > 0 ||
                    changeAnalysis.changes.unchangedUrls.length > 0
                )) {
                    const crawlChanges = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
                    
                    // Filter out unchanged if requested
                    let filteredChanges = crawlChanges;
                    if (!includeUnchanged) {
                        // Skip the header row and filter out unchanged rows
                        const headerRow = filteredChanges[0];
                        const dataRows = filteredChanges.slice(1).filter(row => 
                            row.length > 4 && row[4] !== 'Unchanged'
                        );
                        filteredChanges = [headerRow, ...dataRows];
                    }

                    if (filteredChanges.length > 1) { // More than just header
                        // Add crawl header
                        allChanges.push([`Crawl: ${changeAnalysis.crawlTitle}`]);
                        allChanges.push(['']); // Empty row
                        
                        // Add data rows
                        filteredChanges.forEach(row => {
                            allChanges.push(row);
                        });
                        
                        allChanges.push(['']); // Empty row between crawls
                        allChanges.push(['']); // Another empty row

                        // Update summary
                        summaryData.totalChanges += changeAnalysis.changedUrls;
                        summaryData.totalNew += changeAnalysis.newUrls;
                        summaryData.totalRemoved += changeAnalysis.removedUrls;
                        summaryData.totalUnchanged += changeAnalysis.unchangedUrls;
                        summaryData.crawlBreakdown.push({
                            title: changeAnalysis.crawlTitle,
                            changes: changeAnalysis.changedUrls,
                            new: changeAnalysis.newUrls,
                            removed: changeAnalysis.removedUrls,
                            unchanged: changeAnalysis.unchangedUrls
                        });
                    }
                }
            }

            if (allChanges.length === 0) {
                return {
                    error: 'No changes found in any of the crawls'
                };
            }

            // Write all data to sheet (overwrites from A1)
            await this.writeDataToSheet(spreadsheetId, allChanges);

            // Add global summary sheet
            await this.addGlobalSummarySheet(spreadsheetId, summaryData);

            // Apply formatting
            await this.applyGlobalSummaryFormatting(spreadsheetId, allChanges.length);

            // Share the sheet
            await this.shareSheet(spreadsheetId);

            const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

            return {
                success: true,
                spreadsheetId,
                sheetUrl,
                rowCount: allChanges.length - 1,
                summaryData,
                message: 'Global changes exported successfully'
            };

        } catch (error) {
            console.error('Error exporting global changes:', error);
            return {
                error: `Error exporting global changes: ${error.message}`
            };
        }
    }

    /**
     * Add global summary sheet
     */
    async addGlobalSummarySheet(spreadsheetId, summaryData) {
        try {
            // Create global summary sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Global Summary'
                            }
                        }
                    }]
                }
            });

            // Prepare global summary data
            const globalSummaryData = [
                ['Global Crawl Changes Summary'],
                [''],
                ['Export Date', new Date().toISOString()],
                [''],
                ['Overall Statistics'],
                ['Total Crawls Analyzed', summaryData.totalCrawls],
                ['Total Changes', summaryData.totalChanges],
                ['Total New URLs', summaryData.totalNew],
                ['Total Removed URLs', summaryData.totalRemoved],
                ['Total Unchanged URLs', summaryData.totalUnchanged],
                [''],
                ['Crawl Breakdown'],
                ['Crawl Title', 'Changes', 'New', 'Removed', 'Unchanged']
            ];

            // Add crawl breakdown data
            summaryData.crawlBreakdown.forEach(crawl => {
                globalSummaryData.push([
                    crawl.title,
                    crawl.changes,
                    crawl.new,
                    crawl.removed,
                    crawl.unchanged
                ]);
            });

            // Write global summary data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Global Summary!A1',
                valueInputOption: 'RAW',
                requestBody: { values: globalSummaryData }
            });

            console.log('Added global summary sheet');
        } catch (error) {
            console.error('Error adding global summary sheet:', error);
        }
    }

    /**
     * Apply formatting for multi-crawl sheets
     */
    async applyMultiCrawlFormatting(spreadsheetId) {
        try {
            const sheetMetadata = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'sheets.properties'
            });

            const sheetId = sheetMetadata.data.sheets[0].properties.sheetId;

            const requests = [
                // Header formatting
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                                textFormat: {
                                    bold: true,
                                    foregroundColor: { red: 1, green: 1, blue: 1 }
                                }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                },
                // Auto-resize columns
                {
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId: sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 0,
                            endIndex: 8
                        }
                    }
                },
                // Green for New
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [{
                                sheetId: sheetId,
                                startRowIndex: 1,
                                startColumnIndex: 4,
                                endColumnIndex: 5
                            }],
                            booleanRule: {
                                condition: {
                                    type: 'TEXT_EQ',
                                    values: [{ userEnteredValue: 'New' }]
                                },
                                format: {
                                    backgroundColor: { red: 0.8, green: 1, blue: 0.8 }
                                }
                            }
                        }
                    }
                },
                // Red for Removed
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [{
                                sheetId: sheetId,
                                startRowIndex: 1,
                                startColumnIndex: 4,
                                endColumnIndex: 5
                            }],
                            booleanRule: {
                                condition: {
                                    type: 'TEXT_EQ',
                                    values: [{ userEnteredValue: 'Removed' }]
                                },
                                format: {
                                    backgroundColor: { red: 1, green: 0.8, blue: 0.8 }
                                }
                            }
                        }
                    }
                }
            ];

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });

        } catch (error) {
            console.error('Error applying multi-crawl formatting:', error);
        }
    }

    /**
     * Apply formatting for global summary sheet
     */
    async applyGlobalSummaryFormatting(spreadsheetId, dataLength) {
        try {
            // Get the sheet metadata to get the correct sheet ID
            const sheetMetadata = await this.sheets.spreadsheets.get({
                spreadsheetId,
                fields: 'sheets.properties'
            });

            // Find the Global Summary sheet
            const globalSummarySheet = sheetMetadata.data.sheets.find(sheet => 
                sheet.properties.title === 'Global Summary'
            );

            if (!globalSummarySheet) {
                console.warn('Global Summary sheet not found for formatting');
                return;
            }

            const sheetId = globalSummarySheet.properties.sheetId;

            const requests = [
                // Title formatting
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
                            userEnteredFormat: {
                                textFormat: {
                                    bold: true,
                                    fontSize: 16
                                }
                            }
                        },
                        fields: 'userEnteredFormat(textFormat)'
                    }
                },
                // Section headers formatting
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 4,
                            endRowIndex: 5
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                textFormat: {
                                    bold: true
                                }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                },
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 11,
                            endRowIndex: 12
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                textFormat: {
                                    bold: true
                                }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                },
                // Crawl breakdown header formatting
                {
                    repeatCell: {
                        range: {
                            sheetId: sheetId,
                            startRowIndex: 12,
                            endRowIndex: 13
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                                textFormat: {
                                    bold: true,
                                    foregroundColor: { red: 1, green: 1, blue: 1 }
                                }
                            }
                        },
                        fields: 'userEnteredFormat(backgroundColor,textFormat)'
                    }
                },
                // Auto-resize columns
                {
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId: sheetId,
                            dimension: 'COLUMNS',
                            startIndex: 0,
                            endIndex: 8
                        }
                    }
                }
            ];

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests }
            });

        } catch (error) {
            console.error('Error applying global summary formatting:', error);
        }
    }

    /**
     * Get Google Drive storage quota information
     */
    async getDriveStorageQuota() {
        try {
            if (!this.isAuthenticated()) {
                return {
                    error: 'OAuth2 authentication required'
                };
            }

            const about = await this.drive.about.get({
                fields: 'storageQuota,user'
            });

            const quota = about.data.storageQuota;
            const user = about.data.user;

            return {
                success: true,
                quota: {
                    limit: quota.limit,
                    usage: quota.usage,
                    usageInDrive: quota.usageInDrive,
                    usageInDriveTrash: quota.usageInDriveTrash
                },
                user: {
                    email: user.emailAddress,
                    displayName: user.displayName
                },
                usagePercentage: quota.limit ? Math.round((quota.usage / quota.limit) * 100) : 0
            };

        } catch (error) {
            console.error('Error getting Drive storage quota:', error);
            return {
                error: `Error getting storage quota: ${error.message}`
            };
        }
    }
}

module.exports = new GoogleSheetsOAuth2Service(); 