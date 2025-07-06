// Try to import googleapis, but provide fallback if not available
let google;
try {
    google = require('googleapis').google;
} catch (error) {
    console.warn('Google APIs not available. Google Sheets export will be disabled.');
    google = null;
}

const changeDetectionService = require('./changeDetectionService');

class GoogleSheetsService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.initializeAuth();
    }

    /**
     * Initialize Google Sheets authentication
     */
    async initializeAuth() {
        try {
            if (!google) {
                console.warn('Google APIs not available. Google Sheets export disabled.');
                return;
            }

            this.auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './google-credentials.json',
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive'
                ]
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('Google Sheets authentication initialized');
        } catch (error) {
            console.error('Error initializing Google Sheets auth:', error);
            // Don't throw error, just log it
        }
    }

    /**
     * Export crawl data with change tracking to Google Sheets
     * @param {string} crawlId - The crawl ID to export
     * @param {Object} options - Export options
     * @returns {Object} Export result with sheet URL
     */
    async exportCrawlWithChanges(crawlId, options = {}) {
        try {
            if (!google) {
                return {
                    error: 'Google Sheets API not available. Please install googleapis package and configure credentials.'
                };
            }

            const {
                compareWith = null,
                includeUnchanged = false,
                sheetTitle = null,
                updateExisting = false,
                existingSheetId = null
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

            // Create or update Google Sheet
            let spreadsheetId = existingSheetId;
            if (!spreadsheetId || !updateExisting) {
                spreadsheetId = await this.createNewSheet(sheetTitle || `Crawl Changes - ${changeAnalysis.crawlTitle}`);
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
    async createNewSheet(title) {
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

            return response.data.spreadsheetId;
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

            // Yellow for Changed
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
                                values: [{ userEnteredValue: 'Changed' }]
                            },
                            format: {
                                backgroundColor: { red: 1, green: 0.9, blue: 0.8 }
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
                ['Statistics'],
                ['Total URLs', changeAnalysis.totalUrls],
                ['Changed URLs', changeAnalysis.changedUrls],
                ['New URLs', changeAnalysis.newUrls],
                ['Removed URLs', changeAnalysis.removedUrls],
                ['Unchanged URLs', changeAnalysis.unchangedUrls],
                ['Change Percentage', `${changeAnalysis.summary.changePercentage}%`],
                [''],
                ['Change Breakdown'],
                ['Type', 'Count', 'Percentage'],
                ['Changed', changeAnalysis.changedUrls, `${((changeAnalysis.changedUrls / changeAnalysis.totalUrls) * 100).toFixed(1)}%`],
                ['New', changeAnalysis.newUrls, `${((changeAnalysis.newUrls / changeAnalysis.totalUrls) * 100).toFixed(1)}%`],
                ['Removed', changeAnalysis.removedUrls, `${((changeAnalysis.removedUrls / changeAnalysis.totalUrls) * 100).toFixed(1)}%`],
                ['Unchanged', changeAnalysis.unchangedUrls, `${((changeAnalysis.unchangedUrls / changeAnalysis.totalUrls) * 100).toFixed(1)}%`]
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
            // Don't throw error for summary sheet failures
        }
    }

    /**
     * Export multiple crawls to a single sheet for comparison
     */
    async exportMultipleCrawls(crawlIds, options = {}) {
        try {
            if (!google) {
                return {
                    error: 'Google Sheets API not available. Please install googleapis package and configure credentials.'
                };
            }

            const { sheetTitle = 'Multi-Crawl Comparison' } = options;
            
            const allChanges = [];
            
            // Get changes for each crawl
            for (const crawlId of crawlIds) {
                const changeAnalysis = await changeDetectionService.detectChanges(crawlId);
                const sheetData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
                
                // Add crawl identifier to each row
                sheetData.forEach((row, index) => {
                    if (index === 0) {
                        row.unshift('Crawl Title');
                    } else {
                        row.unshift(changeAnalysis.crawlTitle);
                    }
                });
                
                allChanges.push(...sheetData.slice(1)); // Skip header for all but first
            }

            // Create combined data with header
            const combinedData = [
                ['Crawl Title', 'URL', 'Field', 'Current Value', 'Previous Value', 'Change Status', 'Change Type', 'Last Updated', 'Previous Date'],
                ...allChanges
            ];

            // Create new sheet
            const spreadsheetId = await this.createNewSheet(sheetTitle);
            
            // Write data
            await this.writeDataToSheet(spreadsheetId, combinedData);
            
            // Apply formatting
            await this.applyMultiCrawlFormatting(spreadsheetId);

            return {
                success: true,
                spreadsheetId,
                sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                rowCount: combinedData.length - 1,
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
     * Share the Google Sheet with the user
     */
    async shareSheet(spreadsheetId) {
        try {
            if (!this.sheets) {
                console.warn('Google Sheets API not available for sharing');
                return;
            }

            // Get the user email from environment variable or use a default
            const userEmail = process.env.GOOGLE_SHARE_EMAIL || 'your-email@gmail.com';
            
            if (userEmail === 'your-email@gmail.com') {
                console.warn('⚠️ Please set GOOGLE_SHARE_EMAIL in your .env file to automatically share sheets');
                return;
            }

            // Use the Drive API to share the sheet
            const drive = google.drive({ version: 'v3', auth: this.auth });
            
            await drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: {
                    role: 'writer',
                    type: 'user',
                    emailAddress: userEmail
                },
                sendNotificationEmail: false // Don't send email notification
            });

            console.log(`✅ Sheet shared with ${userEmail}`);
            
        } catch (error) {
            console.error('Error sharing sheet:', error.message);
            // Don't throw error - sharing failure shouldn't break the export
        }
    }

    /**
     * Apply formatting for multi-crawl sheets
     */
    async applyMultiCrawlFormatting(spreadsheetId) {
        try {
            // First, get the sheet metadata to get the correct sheet ID
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
                            endIndex: 9
                        }
                    }
                },
                // Conditional formatting for change status - Green for New
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [{
                                sheetId: sheetId,
                                startRowIndex: 1,
                                startColumnIndex: 5,
                                endColumnIndex: 6
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
                                startColumnIndex: 5,
                                endColumnIndex: 6
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
}

module.exports = new GoogleSheetsService(); 