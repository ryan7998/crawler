# Export Functionality with Change Tracking

This document describes the export functionality that allows you to export crawl data to Google Sheets or CSV with change tracking capabilities.

## Features

### Change Detection

- **Automatic Change Detection**: Compares current crawl data with previous attempts
- **Field-Level Changes**: Tracks changes at individual field level
- **Multiple Comparison Options**: Compare with previous attempt or specific crawl
- **Change Status**: New, Changed, Removed, or Unchanged items

### Export Options

- **Google Sheets Export**: Direct integration with Google Sheets API
- **CSV Export**: Download as CSV file
- **Multiple Crawls**: Export multiple crawls to a single sheet for comparison

## Setup

### 1. Google Sheets API Setup (OAuth2)

1. **Create Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Sheets API and Google Drive API

2. **Create OAuth2 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Desktop application" for development
   - Download the JSON credentials file

3. **Configure Environment**:

   ```bash
   # Add to your .env file
   GOOGLE_OAUTH2_CREDENTIALS=./oauth2-credentials.json
   GOOGLE_DRIVE_FOLDER_ID=your-folder-id  # Optional: for organized exports
   ```

4. **Authenticate**:
   ```bash
   # Run authentication flow
   node oauth2-auth.js
   ```

### 2. Install Dependencies

```bash
cd server
npm install googleapis
```

## API Endpoints

### Export to Google Sheets

```http
POST /api/export/google-sheets/:crawlId
```

**Request Body**:

```json
{
  "compareWith": "optional-crawl-id",
  "includeUnchanged": false,
  "sheetTitle": "Custom Sheet Title",
  "updateExisting": false,
  "existingSheetId": "optional-sheet-id"
}
```

**Response**:

```json
{
  "success": true,
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "changeAnalysis": {
    "totalUrls": 10,
    "changedUrls": 3,
    "newUrls": 1,
    "removedUrls": 0,
    "unchangedUrls": 6
  },
  "rowCount": 25,
  "message": "Crawl data exported successfully with change tracking"
}
```

### Get Change Analysis

```http
GET /api/export/changes/:crawlId?compareWith=optional-crawl-id
```

**Response**:

```json
{
  "crawlId": "crawl-id",
  "crawlTitle": "My Crawl",
  "totalUrls": 10,
  "changedUrls": 3,
  "newUrls": 1,
  "removedUrls": 0,
  "unchangedUrls": 6,
  "changes": {
    "changedUrls": [...],
    "newUrls": [...],
    "removedUrls": [...],
    "unchangedUrls": [...]
  },
  "summary": {
    "changePercentage": "40.0"
  }
}
```

### Export to CSV

```http
GET /api/export/csv/:crawlId?compareWith=optional-crawl-id&includeUnchanged=false
```

### Export Multiple Crawls

```http
POST /api/export/google-sheets/multiple
```

**Request Body**:

```json
{
  "crawlIds": ["crawl-id-1", "crawl-id-2"],
  "sheetTitle": "Multi-Crawl Comparison"
}
```

### Get Available Crawls

```http
GET /api/export/crawls?userId=optional-user-id&limit=50
```

## Google Sheets Format

The exported Google Sheet contains:

### Main Sheet: "Change Tracking"

| Column         | Description                   |
| -------------- | ----------------------------- |
| URL            | The crawled URL               |
| Field          | The data field name           |
| Current Value  | Current field value           |
| Previous Value | Previous field value          |
| Change Status  | New/Changed/Removed/Unchanged |
| Change Type    | new/changed/removed/unchanged |
| Last Updated   | Timestamp of current data     |
| Previous Date  | Timestamp of previous data    |

### Summary Sheet: "Summary"

- Crawl information
- Change statistics
- Change breakdown by type

## Frontend Integration

### ExportModal Component

The `ExportModal.vue` component provides a user-friendly interface for:

1. **Export Type Selection**: Choose between Google Sheets or CSV
2. **Change Detection Options**:
   - Compare with previous crawl
   - Include unchanged items
3. **Google Sheets Options**:
   - Custom sheet title
   - Update existing sheet
4. **Change Preview**: Real-time change analysis

### Usage in CrawlerDashboard

```vue
<template>
  <v-btn @click="showExportModal = true"> Export with Changes </v-btn>

  <ExportModal
    v-model="showExportModal"
    :crawl-id="crawlId"
    :crawl-title="crawl?.title"
  />
</template>
```

## Change Detection Logic

### Comparison Methods

1. **Same Crawl Comparison**: Compares current data with previous attempt of the same crawl
2. **Cross-Crawl Comparison**: Compares with data from a different crawl

### Change Types

- **New**: Field exists in current data but not in previous
- **Changed**: Field value differs between current and previous
- **Removed**: Field exists in previous data but not in current
- **Unchanged**: Field value is identical

### Data Handling

- **Nested Objects**: Flattened for comparison
- **Arrays**: Compared element by element
- **Null/Undefined**: Treated as empty values
- **Data Types**: Converted to strings for comparison

## Error Handling

### Common Issues

1. **Google Sheets API Errors**:

   - Invalid credentials
   - Rate limiting
   - Permission issues

2. **Data Processing Errors**:
   - Large datasets
   - Invalid data formats
   - Memory limitations

### Error Responses

```json
{
  "message": "Error exporting to Google Sheets",
  "error": "Detailed error message"
}
```

## Performance Considerations

### Large Datasets

- **Pagination**: Process data in chunks
- **Memory Management**: Stream large files
- **Rate Limiting**: Respect API limits

### Optimization Tips

1. **Filter Unchanged Data**: Exclude unchanged items for better performance
2. **Batch Operations**: Use Google Sheets batch updates
3. **Caching**: Cache change analysis results

## Security

### Google Sheets Permissions

- **Service Account**: Limited to specific operations
- **Sheet Access**: Read/write permissions only
- **Data Privacy**: No data stored by Google

### Environment Variables

```bash
# Required
GOOGLE_SERVICE_ACCOUNT_KEY=./path/to/key.json

# Optional
GOOGLE_SHEETS_API_QUOTA_LIMIT=1000
```

## Troubleshooting

### Common Problems

1. **"Invalid credentials"**:

   - Check service account key file path
   - Verify Google Sheets API is enabled

2. **"Rate limit exceeded"**:

   - Implement exponential backoff
   - Reduce concurrent requests

3. **"Sheet not found"**:
   - Verify sheet ID is correct
   - Check service account permissions

### Debug Mode

Enable debug logging:

```javascript
// In your service
console.log("Change analysis:", changeAnalysis);
console.log("Sheet data:", sheetData);
```

## Future Enhancements

### Planned Features

1. **Scheduled Exports**: Automatic export on crawl completion
2. **Email Notifications**: Send export links via email
3. **Advanced Filtering**: Filter by change type, date range
4. **Export Templates**: Customizable sheet formats
5. **Real-time Updates**: Live sheet updates during crawl

### Integration Ideas

1. **Slack Notifications**: Post change summaries to Slack
2. **Webhook Support**: Trigger external systems on changes
3. **Analytics Dashboard**: Visual change tracking
4. **Change Alerts**: Email alerts for significant changes
