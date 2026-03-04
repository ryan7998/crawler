/**
 * Constants for CrawlDetailsView and related components
 */

// Crawl Status Constants
export const CRAWL_STATUSES = {
  LOADING: 'loading',
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  STARTED: 'started'
}

// URL Status Constants
export const URL_STATUSES = {
  PENDING: 'pending',
  STARTED: 'started',
  SUCCESS: 'success',
  FAILED: 'failed',
  COMPLETED: 'completed'
}

// Button Variants
export const BUTTON_VARIANTS = {
  PRIMARY: 'bg-blue-600 hover:bg-blue-700 text-white',
  SECONDARY: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  YELLOW: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
  BLUE: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  RED: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
  GREEN: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
  INDIGO: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
}

// Table Configuration
export const TABLE_CONFIG = {
  HEADERS: [
    { 
      key: 'checkbox', 
      label: '', 
      sortable: false,
      width: 'w-12'
    },
    { 
      key: 'url', 
      label: 'URL', 
      sortable: false,
      width: 'flex-1'
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: false,
      width: 'w-32'
    },
    { 
      key: 'actions', 
      label: 'Actions', 
      sortable: false,
      width: 'w-24'
    }
  ],
  ROWS_PER_PAGE: 25,
  MAX_URL_LENGTH: 50,
  EXCERPT_LENGTH: 30
}

// Bulk Actions Configuration
export const BULK_ACTIONS = {
  DELETE: {
    key: 'delete',
    label: 'Clear Selected',
    variant: 'yellow',
    icon: 'trash'
  },
  RESTART: {
    key: 'restart',
    label: 'Restart Selected',
    variant: 'blue',
    icon: 'refresh'
  }
}

// Row Actions Configuration
export const ROW_ACTIONS = {
  VIEW: {
    key: 'view',
    label: 'View',
    variant: 'indigo',
    icon: 'eye'
  },
  CLEAR: {
    key: 'clear',
    label: 'Clear',
    variant: 'red',
    icon: 'trash'
  }
}

// Status Colors
export const STATUS_COLORS = {
  [CRAWL_STATUSES.LOADING]: 'gray',
  [CRAWL_STATUSES.PENDING]: 'yellow',
  [CRAWL_STATUSES.IN_PROGRESS]: 'blue',
  [CRAWL_STATUSES.COMPLETED]: 'green',
  [CRAWL_STATUSES.FAILED]: 'red',
  [URL_STATUSES.PENDING]: 'yellow',
  [URL_STATUSES.STARTED]: 'blue',
  [URL_STATUSES.SUCCESS]: 'green',
  [URL_STATUSES.FAILED]: 'red'
}

// Status Labels
export const STATUS_LABELS = {
  [CRAWL_STATUSES.LOADING]: 'Loading...',
  [CRAWL_STATUSES.PENDING]: 'Pending',
  [CRAWL_STATUSES.IN_PROGRESS]: 'In Progress',
  [CRAWL_STATUSES.COMPLETED]: 'Completed',
  [CRAWL_STATUSES.FAILED]: 'Failed',
  [URL_STATUSES.PENDING]: 'Pending',
  [URL_STATUSES.STARTED]: 'Processing...',
  [URL_STATUSES.SUCCESS]: 'Success',
  [URL_STATUSES.FAILED]: 'Failed'
}

// Socket Events
export const SOCKET_EVENTS = {
  CRAWL_LOG: 'crawlLog',
  CRAWL_STATUS_UPDATE: 'crawlStatusUpdate',
  URL_STATUS_UPDATE: 'urlStatusUpdate'
}

// API Endpoints
export const API_ENDPOINTS = {
  CRAWLS: '/api/crawls',
  CRAWL_DETAILS: (id) => `/api/crawls/${id}`,
  CRAWL_START: (id) => `/api/crawls/${id}/start`,
  CRAWL_STOP: (id) => `/api/crawls/${id}/stop`,
  CRAWL_DELETE: (id) => `/api/crawls/${id}`,
  URL_DELETE: (crawlId, url) => `/api/crawls/${crawlId}/urls/${encodeURIComponent(url)}`,
  PROXY_STATS: (id) => `/api/crawls/${id}/proxy-stats`
}

// Local Storage Keys
export const STORAGE_KEYS = {
  EXPORT_METADATA: (crawlId) => `export_metadata_${crawlId}`,
  SELECTED_URLS: (crawlId) => `selected_urls_${crawlId}`,
  TABLE_PREFERENCES: 'table_preferences'
}

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Notification Messages
export const NOTIFICATION_MESSAGES = {
  CRAWL_STARTED: 'Crawl started successfully',
  CRAWL_STOPPED: 'Crawl stopped successfully',
  CRAWL_DELETED: 'Crawl deleted successfully',
  URLS_CLEARED: 'Selected URLs cleared successfully',
  URLS_RESTARTED: 'Selected URLs restarted successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  EXPORT_FAILED: 'Export failed',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  CONNECTION_RESTORED: 'Connection restored'
}

// Error Messages (deprecated - use useNotification composable instead)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  TIMEOUT: 'Request timed out. Please try again.'
}

// Component Sizes
export const COMPONENT_SIZES = {
  HEADER_HEIGHT: 'h-16',
  SIDEBAR_WIDTH: 'w-80',
  TABLE_ROW_HEIGHT: 'h-12',
  BUTTON_HEIGHT: 'h-10',
  ICON_SIZE: 'w-5 h-5'
}

// Animation Durations (Tailwind classes)
export const ANIMATION_DURATIONS = {
  FAST: 'duration-150',
  NORMAL: 'duration-200',
  SLOW: 'duration-300'
}

// Animation duration in milliseconds (mirrors ANIMATION_DURATIONS.SLOW)
export const SLIDE_OVER_DURATION_MS = 300

