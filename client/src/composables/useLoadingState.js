import { ref, computed } from 'vue'

/**
 * Centralized loading state management composable
 * Provides consistent loading states across the application
 */
export function useLoadingState() {
  // Global loading states
  const loadingStates = ref({})

  /**
   * Set loading state for a specific operation
   * @param {string} key - Unique key for the loading operation
   * @param {boolean} loading - Loading state
   */
  const setLoading = (key, loading) => {
    loadingStates.value[key] = loading
  }

  /**
   * Get loading state for a specific operation
   * @param {string} key - Unique key for the loading operation
   * @returns {boolean} Loading state
   */
  const isLoading = (key) => {
    return !!loadingStates.value[key]
  }

  /**
   * Check if any loading operation is active
   */
  const isAnyLoading = computed(() => {
    return Object.values(loadingStates.value).some(loading => loading)
  })

  /**
   * Get all active loading operations
   */
  const activeLoadingOperations = computed(() => {
    return Object.keys(loadingStates.value).filter(key => loadingStates.value[key])
  })

  /**
   * Clear all loading states
   */
  const clearAllLoading = () => {
    loadingStates.value = {}
  }

  /**
   * Clear loading state for a specific operation
   * @param {string} key - Unique key for the loading operation
   */
  const clearLoading = (key) => {
    delete loadingStates.value[key]
  }

  return {
    // State
    loadingStates: computed(() => loadingStates.value),
    isAnyLoading,
    activeLoadingOperations,
    
    // Methods
    setLoading,
    isLoading,
    clearLoading,
    clearAllLoading
  }
}

/**
 * Predefined loading keys for common operations
 */
export const LOADING_KEYS = {
  // API Operations
  API_REQUEST: 'api_request',
  
  // Crawl Actions
  DELETE_CRAWL: 'delete_crawl',
  CLEAR_QUEUE: 'clear_queue',
  EXPORT_CRAWL: 'export_crawl',
  START_CRAWL: 'start_crawl',
  RESTART_URLS: 'restart_urls',
  
  // Data Fetching
  FETCH_CRAWLS: 'fetch_crawls',
  FETCH_CRAWL_DATA: 'fetch_crawl_data',
  SEARCH_CRAWLS: 'search_crawls',
  
  // Proxy Stats
  FETCH_PROXY_STATS: 'fetch_proxy_stats',
  
  // Auth Operations
  LOGIN: 'login',
  REGISTER: 'register',
  LOGOUT: 'logout'
}
