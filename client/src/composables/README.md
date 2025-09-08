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

## useNotification.js

A composable for managing toast notifications with global state management.

### Features

- **Global State**: Shared notification state across all components
- **Type Safety**: Predefined notification types (success, error, warning, info)
- **Auto-dismiss**: Configurable auto-dismiss duration
- **Manual Control**: Hide notifications manually
- **Backward Compatibility**: Works with existing provide/inject pattern

### Usage

```javascript
import { useNotification } from "../composables/useNotification";

// Basic usage
const { showNotification, showSuccess, showError } = useNotification();

// Show notifications
showNotification("Operation completed", "success");
showSuccess("Data saved successfully");
showError("Something went wrong");

// Advanced usage with options
const { showNotification } = useNotification({
  duration: 5000, // 5 seconds
  global: true, // Use global state
});
```

### API

- `showNotification(message, type, duration)` - Show notification with custom type and duration
- `showSuccess(message)` - Show success notification
- `showError(message)` - Show error notification
- `showWarning(message)` - Show warning notification
- `showInfo(message)` - Show info notification
- `hideNotification()` - Hide current notification
- `showSnackbar` - Reactive state for visibility
- `snackbarText` - Reactive state for message
- `snackbarColor` - Reactive state for type

### Dependencies

- Can use `showNotification` via provide/inject system or `useNotification` composable
- Uses `axios` for HTTP requests
- Uses `getApiUrl` from `../utils/environmentUtils.js`

### Notes

- The composable automatically handles loading states and error messages
- All functions are async and should be awaited
- The composable uses Vue's reactive system, so state changes will automatically update the UI
- Snackbar notifications are handled automatically for success/error states

## useApiService.js

A composable for making HTTP requests with centralized error handling, authentication, and loading states.

### Features

- **Centralized HTTP Client**: Axios-based API service with consistent configuration
- **Authentication**: Automatic token injection and 401 error handling
- **Error Handling**: Comprehensive error message extraction and handling
- **Loading States**: Reactive loading indicators for all requests
- **Request Interceptors**: Automatic auth token injection
- **Response Interceptors**: Automatic auth expiration handling

### Usage

```javascript
import { useApiService } from "../composables/useApiService";

// Basic usage
const { get, post, put, del, loading, error } = useApiService();

// Make requests
const data = await get("/api/crawls");
const result = await post("/api/crawls", { name: "New Crawl" });
const updated = await put("/api/crawls/123", { name: "Updated" });
await del("/api/crawls/123");

// Handle errors
if (error.value) {
  console.error("API Error:", error.value);
}
```

### API

- `get(url, config)` - Make GET request
- `post(url, data, config)` - Make POST request
- `put(url, data, config)` - Make PUT request
- `del(url, config)` - Make DELETE request
- `patch(url, data, config)` - Make PATCH request
- `clearError()` - Clear current error
- `setError(message)` - Set custom error
- `loading` - Reactive loading state
- `error` - Reactive error state

### Dependencies

- Uses `axios` for HTTP requests
- Uses `getApiUrl` from `../utils/environmentUtils.js`
- Uses `useAuthStore` for authentication handling

## useAuth.js

A composable for authentication management with role-based access control and navigation.

### Features

- **Authentication State**: Reactive authentication status and user data
- **Role Management**: Super admin and admin role checking
- **Navigation Integration**: Automatic redirects based on auth status
- **Route Guards**: Helper functions for protecting routes
- **Auto-initialization**: Automatic auth state initialization

### Usage

```javascript
import { useAuth } from "../composables/useAuth";

// Basic usage
const {
  isAuthenticated,
  user,
  loading,
  error,
  isSuperAdmin,
  isAdmin,
  userFullName,
  login,
  register,
  logout,
  requireAuth,
  requireSuperAdmin,
  requireAdmin,
} = useAuth();

// Authentication
const result = await login({ email, password });
const registerResult = await register({ firstName, lastName, email, password });
await logout();

// Route protection
if (requireAuth()) {
  // User is authenticated
}

if (requireSuperAdmin()) {
  // User is super admin
}
```

### API

- `login(credentials)` - Login with email/password
- `register(userData)` - Register new user
- `logout()` - Logout and clear session
- `requireAuth()` - Check if user is authenticated (redirects if not)
- `requireSuperAdmin()` - Check if user is super admin
- `requireAdmin()` - Check if user is admin or super admin
- `initializeAuth()` - Initialize authentication state
- `clearError()` - Clear authentication error

### State

- `isAuthenticated` - Boolean indicating if user is logged in
- `user` - Current user object
- `loading` - Authentication loading state
- `error` - Authentication error message
- `isSuperAdmin` - Boolean indicating super admin status
- `isAdmin` - Boolean indicating admin status
- `userFullName` - Formatted user full name
- `isInitialized` - Boolean indicating if auth is initialized

### Dependencies

- Uses `useAuthStore` for state management
- Uses `useRouter` for navigation

## useExcerpts.js

A composable for creating expandable text excerpts with truncation functionality.

### Features

- **Text Truncation**: Automatic text truncation with ellipsis
- **Expandable Content**: Toggle between truncated and full text
- **Custom Length**: Configurable truncation length
- **Reactive**: Works with reactive text references
- **Reset Functionality**: Reset to truncated state

### Usage

```javascript
import { useExcerpts } from "../composables/useExcerpts";
import { ref } from "vue";

// Basic usage
const text = ref("This is a very long text that will be truncated...");
const { excerpt, isExpanded, toggleExpand, reset } = useExcerpts(text, 50);

// In template
// <p>{{ excerpt }}</p>
// <button @click="toggleExpand">
//   {{ isExpanded ? 'Show Less' : 'Show More' }}
// </button>
```

### API

- `excerpt` - Computed property with truncated or full text
- `isExpanded` - Boolean indicating if text is expanded
- `toggleExpand()` - Toggle between truncated and full text
- `reset()` - Reset to truncated state

### Parameters

- `textRef` - Reactive reference to the text (required)
- `length` - Maximum length before truncation (default: 50)

## useProxyStats.js

A composable for managing proxy usage statistics and cost analysis.

### Features

- **Crawl-specific Stats**: Proxy usage for individual crawls
- **Global Stats**: System-wide proxy usage statistics
- **Cost Analysis**: Detailed cost breakdown and analysis
- **URL-specific Usage**: Proxy usage for specific URLs
- **Data Cleanup**: Cleanup old proxy usage records
- **Formatted Data**: Pre-formatted data for display
- **Error Handling**: Graceful handling of missing endpoints

### Usage

```javascript
import { useProxyStats } from "../composables/useProxyStats";

// Basic usage
const {
  proxyStats,
  globalStats,
  costAnalysis,
  loading,
  error,
  fetchCrawlProxyStats,
  fetchGlobalProxyStats,
  fetchCostAnalysis,
  formattedCrawlStats,
  formattedGlobalStats,
} = useProxyStats();

// Fetch data
await fetchCrawlProxyStats("crawlId123");
await fetchGlobalProxyStats();
await fetchCostAnalysis({ startDate: "2024-01-01", endDate: "2024-01-31" });
```

### API

- `fetchCrawlProxyStats(crawlId)` - Get proxy stats for specific crawl
- `fetchGlobalProxyStats()` - Get global proxy statistics
- `fetchCostAnalysis(params)` - Get cost analysis data
- `fetchProxyUsageForUrl(url)` - Get proxy usage for specific URL
- `cleanupProxyUsage(daysOld)` - Cleanup old proxy usage records

### Computed Properties

- `formattedCrawlStats` - Formatted crawl-specific statistics
- `formattedGlobalStats` - Formatted global statistics
- `formattedCostAnalysis` - Formatted cost analysis data

### State

- `proxyStats` - Crawl-specific proxy statistics
- `globalStats` - Global proxy statistics
- `costAnalysis` - Cost analysis data
- `loading` - Loading state
- `error` - Error message

### Dependencies

- Uses `useApiService` for HTTP requests
- Uses `useAuth` for authentication
- Uses formatting utilities from `../utils/formattingUtils.js`

## useSocketConnection.js

A composable for managing WebSocket connections with Socket.io.

### Features

- **Auto-connection**: Automatic connection on component mount
- **Reconnection**: Configurable reconnection attempts and delays
- **Room Management**: Join and leave specific rooms
- **Event Handling**: Listen to and emit custom events
- **Error Handling**: Connection error management
- **Cleanup**: Automatic cleanup on component unmount

### Usage

```javascript
import { useSocketConnection } from "../composables/useSocketConnection";

// Basic usage
const {
  socket,
  isConnected,
  connectionError,
  connect,
  disconnect,
  joinRoom,
  leaveRoom,
  emit,
  on,
  off,
} = useSocketConnection();

// Advanced usage with options
const socketConnection = useSocketConnection({
  socketUrl: "ws://localhost:3002",
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Use socket
joinRoom("crawl123");
emit("customEvent", { data: "value" });
on("crawlLog", (data) => {
  console.log("Crawl log:", data);
});
```

### API

- `connect()` - Manually connect to socket
- `disconnect()` - Disconnect from socket
- `joinRoom(roomId)` - Join a specific room
- `leaveRoom(roomId)` - Leave a specific room
- `emit(event, data)` - Emit event to server
- `on(event, callback)` - Listen to event from server
- `off(event, callback)` - Remove event listener
- `cleanup()` - Cleanup connection and listeners

### State

- `socket` - Socket.io instance
- `isConnected` - Boolean indicating connection status
- `connectionError` - Connection error message

### Options

- `socketUrl` - Socket server URL (default: from environment)
- `autoConnect` - Auto-connect on mount (default: true)
- `reconnectionAttempts` - Max reconnection attempts (default: 5)
- `reconnectionDelay` - Delay between reconnection attempts (default: 1000ms)
- `path` - Socket.io path (default: '/socket.io/')
- `transports` - Transport methods (default: ['websocket', 'polling'])

### Dependencies

- Uses `socket.io-client` for WebSocket connection
- Uses `getSocketUrl` from `../utils/environmentUtils.js`
