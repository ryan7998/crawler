# Crawl Data Management

This document describes the functionality to delete crawled data for specific crawls or URLs.

## API Endpoints

### 1. Delete All Crawl Data for a Crawl

**Endpoint:** `DELETE /api/crawl/deletecrawldata/:id`

Deletes all crawled data for a specific crawl while keeping the crawl configuration intact.

**Response:**

```json
{
  "message": "Crawl data deleted successfully",
  "deletedDataCount": 15,
  "deletedJobsCount": 3,
  "crawlId": "683bf1c9bb5ef05c9298085a"
}
```

### 2. Delete Crawl Data for Specific URLs

**Endpoint:** `DELETE /api/crawl/deletecrawldata/:id/urls`

**Body:**

```json
{
  "urls": [
    "https://www.amazon.ca/dp/B01HH198KW",
    "https://www.amazon.ca/dp/B0B75R226H"
  ]
}
```

Deletes crawled data for specific URLs within a crawl.

**Response:**

```json
{
  "message": "Crawl data for specific URLs deleted successfully",
  "deletedDataCount": 2,
  "deletedJobsCount": 1,
  "remainingDataCount": 13,
  "crawlId": "683bf1c9bb5ef05c9298085a",
  "deletedUrls": [
    "https://www.amazon.ca/dp/B01HH198KW",
    "https://www.amazon.ca/dp/B0B75R226H"
  ]
}
```

## Command Line Utilities

### 1. List All Crawls

```bash
node utils/manageCrawlData.js list
```

Shows all available crawls with their IDs, titles, status, and URL counts.

### 2. Show Crawl Data

```bash
node utils/manageCrawlData.js show <crawlId>
```

Displays detailed information about a specific crawl and its crawled data.

### 3. Delete All Crawl Data

```bash
node utils/manageCrawlData.js delete-all <crawlId>
```

Deletes all crawled data for a specific crawl with confirmation prompt.

### 4. Delete Data for Specific URLs

```bash
node utils/manageCrawlData.js delete-urls <crawlId> <url1> <url2> ...
```

Deletes crawled data for specific URLs within a crawl.

## What Gets Deleted

When you delete crawl data, the following happens:

1. **CrawlData Documents**: All `CrawlData` documents associated with the crawl (or specific URLs) are removed from the database
2. **Queue Jobs**: Any pending, active, delayed, or failed jobs for the crawl (or specific URLs) are removed from the queue
3. **Crawl Status Reset**: If all data is deleted, the crawl status is reset to 'pending' and timestamps are cleared
4. **Results Array**: The `results` array in the Crawl document is cleared

## What Stays Intact

The following crawl configuration remains unchanged:

- Crawl title
- URL list
- Selectors configuration
- Creation timestamp
- Crawl ID

## Examples

### Using the API

```javascript
// Delete all data for a crawl
fetch("/api/crawl/deletecrawldata/683bf1c9bb5ef05c9298085a", {
  method: "DELETE",
});

// Delete data for specific URLs
fetch("/api/crawl/deletecrawldata/683bf1c9bb5ef05c9298085a/urls", {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    urls: [
      "https://www.amazon.ca/dp/B01HH198KW",
      "https://www.amazon.ca/dp/B0B75R226H",
    ],
  }),
});
```

### Using Command Line

```bash
# List all crawls
node utils/manageCrawlData.js list

# Show details for a specific crawl
node utils/manageCrawlData.js show 683bf1c9bb5ef05c9298085a

# Delete all data for a crawl
node utils/manageCrawlData.js delete-all 683bf1c9bb5ef05c9298085a

# Delete data for specific URLs
node utils/manageCrawlData.js delete-urls 683bf1c9bb5ef05c9298085a "https://www.amazon.ca/dp/B01HH198KW" "https://www.amazon.ca/dp/B0B75R226H"
```

## Safety Features

1. **Validation**: All crawl IDs are validated before processing
2. **Confirmation**: The command-line tool asks for confirmation before deleting all data
3. **Error Handling**: Comprehensive error handling and logging
4. **Atomic Operations**: Database operations are performed atomically
5. **Queue Cleanup**: Queue jobs are properly cleaned up to prevent orphaned jobs

## Notes

- After deleting crawl data, you can re-run the crawl to collect fresh data
- The crawl configuration (URLs, selectors) remains intact for easy re-crawling
- Queue jobs are automatically cleaned up to prevent conflicts
- The system maintains data consistency by updating crawl status appropriately
