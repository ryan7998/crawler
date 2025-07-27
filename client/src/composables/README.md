# Composables

This directory contains Vue 3 composables that provide reusable functionality across components.

## useCrawlManagement

A composable that provides crawl management functionality including fetching crawls, running all crawls, and toggling crawl disable/enable status.

### Usage

```javascript
import { useCrawlManagement } from "../composables/useCrawlManagement";

// Use the composable
const {
  crawls,
  totalCrawls,
  isSearching,
  runAllLoading,
  disableLoadingId,
  showSnackbar,
  snackbarText,
  snackbarColor,
  fetchCrawls,
  runAllCrawls,
  toggleDisableCrawl,
} = useCrawlManagement();
```

### Available State

- `crawls` - Array of crawl objects
- `totalCrawls` - Total number of crawls (for pagination)
- `isSearching` - Boolean indicating if a search is in progress
- `runAllLoading` - Boolean indicating if "run all crawls" is in progress
- `disableLoadingId` - ID of the crawl currently being toggled (if any)
- `showSnackbar` - Boolean to control snackbar visibility
- `snackbarText` - Text to display in the snackbar
- `snackbarColor` - Color of the snackbar ('success', 'error', etc.)

### Available Functions

#### `fetchCrawls(options, searchQuery)`

Fetches crawls with pagination and search functionality.

**Parameters:**

- `options` - Object with pagination options (page, itemsPerPage)
- `searchQuery` - String for search filtering

**Example:**

```javascript
// Fetch first page with 10 items per page
await fetchCrawls({ page: 1, itemsPerPage: 10 }, "");

// Fetch with search
await fetchCrawls({ page: 1, itemsPerPage: 10 }, "amazon");
```

#### `runAllCrawls()`

Starts all non-disabled crawls that are not currently in progress.

**Example:**

```javascript
await runAllCrawls();
```

#### `toggleDisableCrawl(crawl)`

Toggles the disabled status of a crawl.

**Parameters:**

- `crawl` - Crawl object to toggle

**Example:**

```javascript
await toggleDisableCrawl(crawlItem);
```

### Example Component

See `CrawlManagementExample.vue` for a complete example of how to use this composable.

### Dependencies

- Requires `showNotification` to be provided via Vue's provide/inject system
- Uses `axios` for HTTP requests
- Uses `getApiUrl` from `../utils/commonUtils.js`

### Notes

- The composable automatically handles loading states and error messages
- All functions are async and should be awaited
- The composable uses Vue's reactive system, so state changes will automatically update the UI
- Snackbar notifications are handled automatically for success/error states
