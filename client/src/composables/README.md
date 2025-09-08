# Composables

This directory contains Vue 3 composables that provide reusable functionality across components.

## useCrawlManagement

A composable that provides crawl management functionality including fetching crawls, running all crawls, and toggling crawl disable/enable status. This composable focuses on business logic and delegates UI state to components.

### Usage

```javascript
import { useCrawlManagement } from "../composables/useCrawlManagement";
import { useCrawlStore } from "../stores/crawlStore";

// Use the composable
const {
  isSearching,
  runAllLoading,
  disableLoadingId,
  fetchCrawls,
  runAllCrawls,
  toggleDisableCrawl,
} = useCrawlManagement();

// Get crawl data from store
const crawlStore = useCrawlStore();
const crawls = computed(() => crawlStore.allCrawls);
const totalCrawls = computed(() => crawlStore.allCrawls.length);
```

### Available State

- `isSearching` - Boolean indicating if a search is in progress
- `runAllLoading` - Boolean indicating if "run all crawls" is in progress
- `disableLoadingId` - ID of the crawl currently being toggled (if any)

**Note**: `crawls` and `totalCrawls` are now available through the `crawlStore` to avoid duplication.

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

**Returns:** `Promise<Object>` - Result object with success status and message

**Example:**

```javascript
const result = await runAllCrawls();
if (result.success) {
  console.log("Crawls started:", result.message);
}
```

#### `toggleDisableCrawl(crawl)`

Toggles the disabled status of a crawl.

**Parameters:**

- `crawl` - Crawl object to toggle

**Returns:** `Promise<Object>` - Result object with success status and message

**Example:**

```javascript
const result = await toggleDisableCrawl(crawlItem);
if (result.success) {
  console.log("Crawl toggled:", result.message);
}
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
