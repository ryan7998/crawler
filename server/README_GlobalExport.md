# Global Export Functionality

This document describes the global export functionality that allows you to export changes from all crawls to a single Google Sheet or CSV file.

## Overview

The global export feature enables you to:

- Export changes from multiple crawls in a single operation
- Filter crawls by user ID, status, and other criteria
- Get a comprehensive overview of all changes across your crawl data
- Generate detailed summary statistics

## Features

### Export Options

- **Google Sheets Export**: Primary export method with formatting and summary sheets
- **CSV Export**: Basic CSV download (limited functionality for global exports)
- **Filtering**: Filter by user ID, crawl status, and limit number of crawls
- **Change Detection**: Automatically detect changes for each crawl
- **Summary Statistics**: Comprehensive overview of all changes

### Filtering Capabilities

- **User ID Filter**: Export crawls from specific users
- **Status Filter**: Filter by crawl status (pending, in-progress, completed, failed)
- **Limit**: Control the number of crawls processed (default: 100, max: 500)
- **Include Unchanged**: Option to include crawls with no changes

## API Endpoints

### Global Export to Google Sheets

```http
POST /api/export/google-sheets/global
```

**Request Body:**

```json
{
  "userId": "optional-user-id",
  "includeUnchanged": false,
  "sheetTitle": "Custom Sheet Title",
  "limit": 100,
  "statusFilter": "completed"
}
```

**Response:**

```json
{
  "success": true,
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "rowCount": 150,
  "crawlCount": 25,
  "processedCrawlCount": 20,
  "totalUrls": 500,
  "totalChangedUrls": 45,
  "totalNewUrls": 30,
  "totalRemovedUrls": 15,
  "message": "Global crawl changes exported successfully"
}
```

## Google Sheets Format

### Main Sheet: "Change Tracking"

| Column         | Description                   |
| -------------- | ----------------------------- |
| Crawl Title    | The crawl name                |
| URL            | The crawled URL               |
| Field          | The data field name           |
| Current Value  | Current field value           |
| Previous Value | Previous field value          |
| Change Status  | New/Changed/Removed/Unchanged |
| Change Type    | new/changed/removed/unchanged |
| Last Updated   | Timestamp of current data     |
| Previous Date  | Timestamp of previous data    |

### Global Summary Sheet: "Global Summary"

Contains:

- Export information (date, crawl counts)
- Overall statistics across all crawls
- Individual crawl breakdown with statistics
- Change percentages and totals

## Frontend Integration

### GlobalExportModal Component

The `GlobalExportModal.vue` component provides:

1. **Export Type Selection**: Google Sheets or CSV
2. **Filtering Options**:
   - User ID filter
   - Status filter
   - Crawl limit
   - Include unchanged items
3. **Preview Information**: Shows how many crawls will be processed
4. **Progress Tracking**: Loading indicators during export
5. **Success Feedback**: Detailed results display

### Usage in Components

#### HomePage Integration

```vue
<template>
  <v-btn @click="showGlobalExportModal = true">
    <v-icon start icon="mdi-download-multiple" />
    Global Export
  </v-btn>

  <GlobalExportModal
    v-model="showGlobalExportModal"
    @export-success="handleGlobalExportSuccess"
  />
</template>
```

#### CrawlerDashboard Integration

```vue
<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <h6 class="font-semibold text-gray-700 mb-4">Global Export</h6>
    <v-btn @click="showGlobalExportModal = true"> Export All Crawls </v-btn>
  </div>

  <GlobalExportModal
    v-model="showGlobalExportModal"
    @export-success="handleGlobalExportSuccess"
  />
</template>
```

## Backend Implementation

### GoogleSheetsService Methods

#### `exportGlobalChanges(options)`

Main method for global export functionality:

- Fetches crawls based on filters
- Processes each crawl for changes
- Combines all changes into a single sheet
- Applies formatting and creates summary sheets
- Returns comprehensive export results

#### `addGlobalSummarySheet(spreadsheetId, summaryData)`

Creates a detailed summary sheet with:

- Export metadata
- Overall statistics
- Individual crawl breakdown
- Change percentages and totals

#### `applyGlobalSummaryFormatting(spreadsheetId, dataLength)`

Applies professional formatting to the summary sheet:

- Title formatting
- Section header styling
- Column auto-resizing
- Color-coded sections

## Error Handling

### Common Scenarios

1. **No Crawls Found**: Returns error if no crawls match criteria
2. **No Changes Found**: Returns error if no changes detected in any crawls
3. **Google Sheets API Errors**: Handles authentication and permission issues
4. **Individual Crawl Errors**: Continues processing other crawls if one fails

### Error Responses

```json
{
  "error": "No crawls found matching the criteria"
}
```

```json
{
  "error": "No changes found in any of the selected crawls"
}
```

## Performance Considerations

### Large Datasets

- **Crawl Limit**: Default 100, configurable up to 500
- **Memory Management**: Processes crawls sequentially
- **Error Recovery**: Continues processing if individual crawls fail
- **Progress Tracking**: Real-time feedback during export

### Optimization Tips

1. **Use Filters**: Filter by user ID or status to reduce processing time
2. **Limit Crawls**: Set appropriate limits for large datasets
3. **Exclude Unchanged**: Skip unchanged items to reduce output size
4. **Monitor Progress**: Use the preview information to estimate processing time

## Testing

### Test Script

Use the provided test script to verify functionality:

```bash
cd server
node test-global-export.js
```

The test script covers:

- Endpoint availability
- Default export functionality
- Filtered exports
- Error handling scenarios

## Configuration

### Environment Variables

Ensure these are set for Google Sheets integration:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json
GOOGLE_SHARE_EMAIL=your-email@gmail.com
```

### Dependencies

Required packages:

```bash
npm install googleapis
```

## Usage Examples

### Basic Global Export

```javascript
const result = await axios.post("/api/export/google-sheets/global", {
  limit: 50,
  includeUnchanged: false,
});
```

### Filtered Export

```javascript
const result = await axios.post("/api/export/google-sheets/global", {
  userId: "user123",
  statusFilter: "completed",
  limit: 25,
  sheetTitle: "My Custom Export",
});
```

### Include All Data

```javascript
const result = await axios.post("/api/export/google-sheets/global", {
  includeUnchanged: true,
  limit: 200,
});
```

## Troubleshooting

### Common Issues

1. **"No crawls found"**: Check your filter criteria
2. **"No changes found"**: Verify crawls have multiple runs for comparison
3. **Google Sheets errors**: Check service account configuration
4. **Timeout errors**: Reduce the crawl limit for large datasets

### Debug Steps

1. Check server logs for detailed error messages
2. Verify Google Sheets API credentials
3. Test with smaller limits first
4. Ensure crawls have sufficient data for comparison

## Future Enhancements

Potential improvements:

- CSV export for global changes
- Scheduled global exports
- Email notifications for completed exports
- Export templates and customization
- Advanced filtering options
- Export history and management
