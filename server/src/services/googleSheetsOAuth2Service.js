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

class GoogleSheetsOAuth2Service {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.drive = null;
        this.credentials = null;
        this.tokens = null;
        this.initializeAuth();
    }

    // --- OAuth2 Setup ---
    async initializeAuth() {
        try {
            if (!google) return;
            const credentialsPath = process.env.GOOGLE_OAUTH2_CREDENTIALS || './oauth2-credentials.json';
            if (!fs.existsSync(credentialsPath)) return;
            this.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            const tokensPath = './oauth2-tokens.json';
            if (fs.existsSync(tokensPath)) {
                this.tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
            }
            const { client_secret, client_id, redirect_uris } = this.credentials.web || this.credentials.installed;
            const redirectUri = process.env.GOOGLE_OAUTH2_REDIRECT_URI || redirect_uris[0];
            this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);
            if (this.tokens) {
                this.oAuth2Client.setCredentials(this.tokens);
                this.auth = this.oAuth2Client;
                this.sheets = google.sheets({ version: 'v4', auth: this.auth });
                this.drive = google.drive({ version: 'v3', auth: this.auth });
            }
        } catch (error) {
            console.error('Error initializing OAuth2 auth:', error);
        }
    }
    getAuthUrl() {
        if (!this.oAuth2Client) throw new Error('OAuth2 client not initialized');
        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ];
        const redirectUri = process.env.GOOGLE_OAUTH2_REDIRECT_URI || 'http://localhost';
        return this.oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            redirect_uri: redirectUri
        });
    }
    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oAuth2Client.getToken(code);
            this.tokens = tokens;
            this.oAuth2Client.setCredentials(tokens);
            fs.writeFileSync('./oauth2-tokens.json', JSON.stringify(tokens));
            this.auth = this.oAuth2Client;
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            return tokens;
        } catch (error) {
            console.error('Error getting tokens:', error);
            throw error;
        }
    }
    isAuthenticated() {
        return this.auth && this.sheets && this.drive;
    }

    // --- Sheet Operations ---
    async createNewSheet(title, folderId = null) {
        const response = await this.sheets.spreadsheets.create({
            requestBody: {
                properties: { title: title || `Crawl Data - ${new Date().toISOString().split('T')[0]}` },
                sheets: [{ properties: { title: 'Change Tracking', gridProperties: { rowCount: 1000, columnCount: 10 } } }]
            }
        });
        const spreadsheetId = response.data.spreadsheetId;
        if (folderId) {
            try {
                await this.drive.files.update({
                    fileId: spreadsheetId,
                    addParents: folderId,
                    removeParents: 'root',
                    fields: 'id, parents'
                });
            } catch {}
        }
        return spreadsheetId;
    }
    async writeDataToSheet(spreadsheetId, data) {
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'A1',
            valueInputOption: 'RAW',
            requestBody: { values: data }
        });
    }
    async clearSheetContents(spreadsheetId, sheetName = 'Change Tracking') {
        await this.sheets.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}` });
    }
    async shareSheet(spreadsheetId) {
        try {
            if (!this.drive) return;
            const userEmail = process.env.GOOGLE_SHARE_EMAIL;
            if (!userEmail) return;
            await this.drive.permissions.create({
                fileId: spreadsheetId,
                requestBody: { role: 'writer', type: 'user', emailAddress: userEmail },
                sendNotificationEmail: false
            });
        } catch {}
    }
    // --- Helper: Find Sheet by Name ---
    async getSheetIdByName(spreadsheetId, sheetName) {
        const sheetMetadata = await this.sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
        const sheet = sheetMetadata.data.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error(`${sheetName} sheet not found`);
        return sheet.properties.sheetId;
    }
    // --- Helper: Get Column Index by Header ---
    async getColumnIndex(spreadsheetId, sheetName, headerName) {
        const header = await this.sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!1:1` });
        const headers = header.data.values[0];
        return headers.indexOf(headerName);
    }

    // --- Formatting ---
    async applyFormatting(spreadsheetId, sheetName = 'Change Tracking') {
        const sheetId = await this.getSheetIdByName(spreadsheetId, sheetName);
        const changeTypeCol = await this.getColumnIndex(spreadsheetId, sheetName, 'Change Type');
        const header = await this.sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!1:1` });
        const headers = header.data.values[0];
        const requests = [];
        // Header formatting
        requests.push({
            repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                        textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                    }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
        });
        // Auto-resize columns
        requests.push({
            autoResizeDimensions: {
                dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: headers.length }
            }
        });
        if (changeTypeCol !== -1) {
            // Green for New
            requests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: changeTypeCol, endColumnIndex: changeTypeCol + 1 }],
                        booleanRule: {
                            condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'New' }] },
                            format: { backgroundColor: { red: 0.8, green: 1, blue: 0.8 } }
                        }
                    }
                }
            });
            // Red for Removed
            requests.push({
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId, startRowIndex: 1, startColumnIndex: changeTypeCol, endColumnIndex: changeTypeCol + 1 }],
                        booleanRule: {
                            condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: 'Removed' }] },
                            format: { backgroundColor: { red: 1, green: 0.8, blue: 0.8 } }
                        }
                    }
                }
            });
        }
        await this.sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
    }

    // --- Export Logic ---
    async exportCrawlWithChanges(crawlId, options = {}) {
        if (!this.isAuthenticated()) return { error: 'OAuth2 authentication required. Please run the authentication flow first.' };
        const { compareWith = null, includeUnchanged = false, sheetTitle = null, updateExisting = false, existingSheetId = null, folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null } = options;
        const Crawl = require('../models/Crawl');
        const crawl = await Crawl.findById(crawlId);
        const changeAnalysis = await changeDetectionService.detectChanges(crawlId, compareWith);
        const sheetData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes, changeAnalysis.crawlTitle, crawl?.comparisonSelectors || null);
        let filteredData = sheetData;
        if (!includeUnchanged) {
            filteredData = sheetData.filter(row => row.length > 4 && row[4] !== 'Unchanged');
        }
        let spreadsheetId = existingSheetId;
        if (!spreadsheetId || !updateExisting) {
            spreadsheetId = await this.createNewSheet(sheetTitle || `Crawl Changes - ${changeAnalysis.crawlTitle}`, folderId);
        }
        await this.clearSheetContents(spreadsheetId, 'Change Tracking');
        await this.writeDataToSheet(spreadsheetId, filteredData);
        await this.applyFormatting(spreadsheetId, 'Change Tracking');
        await this.shareSheet(spreadsheetId);
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        return { success: true, spreadsheetId, sheetUrl, changeAnalysis, rowCount: filteredData.length - 1, message: 'Crawl data exported successfully with change tracking' };
    }
    async exportMultipleCrawls(crawlIds, options = {}) {
        if (!this.isAuthenticated()) return { error: 'OAuth2 authentication required. Please run the authentication flow first.' };
        const { sheetTitle, folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null } = options;
        const finalSheetTitle = sheetTitle || `Multiple Crawls - ${new Date().toISOString().split('T')[0]}`;
        const spreadsheetId = await this.createNewSheet(finalSheetTitle, folderId);
        const allData = [];
        for (const crawlId of crawlIds) {
            const changeAnalysis = await changeDetectionService.detectChanges(crawlId);
            const crawlData = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes);
            allData.push([`Crawl: ${changeAnalysis.crawlTitle}`]);
            allData.push(['']);
            crawlData.forEach(row => allData.push(row));
            allData.push(['']);
            allData.push(['']);
        }
        await this.writeDataToSheet(spreadsheetId, allData);
        await this.applyFormatting(spreadsheetId, 'Change Tracking');
        await this.shareSheet(spreadsheetId);
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        return { success: true, spreadsheetId, sheetUrl, rowCount: allData.length - 1, message: 'Multiple crawls exported successfully' };
    }
    async exportGlobalChanges(options = {}) {
        if (!this.isAuthenticated()) return { error: 'OAuth2 authentication required. Please run the authentication flow first.' };
        const { userId, includeUnchanged = false, sheetTitle, limit = 100, statusFilter, folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null } = options;
        const Crawl = require('../models/Crawl');
        let query = {};
        if (userId) query.userId = userId;
        if (statusFilter) query.status = statusFilter;
        const crawls = await Crawl.find(query).limit(limit).sort({ createdAt: -1 });
        if (crawls.length === 0) return { error: 'No crawls found matching the criteria' };
        // Filter out disabled crawls
        const enabledCrawls = crawls.filter(crawl => !crawl.disabled);
        if (enabledCrawls.length === 0) return { error: 'No enabled crawls found matching the criteria' };
        let spreadsheetId = process.env.GOOGLE_GLOBAL_EXPORT_SHEET_ID;
        if (!spreadsheetId) {
            spreadsheetId = await this.createNewSheet(sheetTitle || `Global Crawl Changes - ${new Date().toISOString().split('T')[0]}`, folderId);
        }
        let allChanges = [];
        const summaryData = { totalCrawls: enabledCrawls.length, totalChanges: 0, totalNew: 0, totalRemoved: 0, totalUnchanged: 0, crawlBreakdown: [] };
        let crawlsWithData = 0;
        for (const crawl of enabledCrawls) {
            let changeAnalysis;
            try {
                changeAnalysis = await changeDetectionService.detectChanges(crawl._id.toString());
            } catch (err) {
                if (err && err.message === 'No crawl data found for this crawl') {
                    console.warn(`Skipping crawl '${crawl.title}' (${crawl._id}): No crawl data found.`);
                    continue;
                } else {
                    // For other errors, rethrow
                    throw err;
                }
            }
            if (changeAnalysis.changes && (
                changeAnalysis.changes.newUrls.length > 0 ||
                changeAnalysis.changes.removedUrls.length > 0 ||
                changeAnalysis.changes.changedUrls.length > 0 ||
                changeAnalysis.changes.unchangedUrls.length > 0
            )) {
                crawlsWithData++;
                const crawlRows = changeDetectionService.prepareForGoogleSheets(changeAnalysis.changes, changeAnalysis.crawlTitle, crawl.comparisonSelectors || null);
                let filteredRows = crawlRows;
                if (!includeUnchanged) {
                    const headerRow = filteredRows[0];
                    const dataRows = filteredRows.slice(1).filter(row => row.length > 4 && row[4] !== 'Unchanged');
                    filteredRows = [headerRow, ...dataRows];
                }
                if (allChanges.length === 0) {
                    allChanges = filteredRows;
                } else {
                    allChanges.push(...filteredRows.slice(1));
                }
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
        if (allChanges.length === 0 || crawlsWithData === 0) return { error: 'No changes found in any of the crawls' };
        await this.clearSheetContents(spreadsheetId, 'Change Tracking');
        await this.writeDataToSheet(spreadsheetId, allChanges);
        await this.addGlobalSummarySheet(spreadsheetId, summaryData);
        await this.applyFormatting(spreadsheetId, 'Change Tracking');
        await this.shareSheet(spreadsheetId);
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
        return { success: true, spreadsheetId, sheetUrl, rowCount: allChanges.length - 1, summaryData, message: 'Global changes exported successfully' };
    }

    // --- Summary Sheet ---
    async addGlobalSummarySheet(spreadsheetId, summaryData) {
        // Remove existing Global Summary sheet if present
        const sheetMetadata = await this.sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
        const existingSheet = sheetMetadata.data.sheets.find(sheet => sheet.properties.title === 'Global Summary');
        if (existingSheet) {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: [{ deleteSheet: { sheetId: existingSheet.properties.sheetId } }] }
            });
        }
        // Add new Global Summary sheet
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: [{ addSheet: { properties: { title: 'Global Summary' } } }] }
        });
        // Prepare and write summary data
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
        summaryData.crawlBreakdown.forEach(crawl => {
            globalSummaryData.push([
                crawl.title,
                crawl.changes,
                crawl.new,
                crawl.removed,
                crawl.unchanged
            ]);
        });
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Global Summary!A1',
            valueInputOption: 'RAW',
            requestBody: { values: globalSummaryData }
        });
    }
}

module.exports = new GoogleSheetsOAuth2Service(); 