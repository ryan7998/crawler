import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApiService } from './useApiService'
import { useCrawlStore } from '../stores/crawlStore'
import { useNotification } from './useNotification'
import { useLoadingState, LOADING_KEYS } from './useLoadingState'

/**
 * Composable for managing crawl actions
 * Provides centralized functions for crawl operations that can be used across components
 */
export function useCrawlActions() {
  const router = useRouter()
  const { get, post, del } = useApiService()
  const crawlStore = useCrawlStore()
  const { showNotification, handleError } = useNotification()
  const { setLoading, isLoading } = useLoadingState()

  /**
   * Show delete crawl confirmation
   * @param {string} crawlId - The ID of the crawl to delete
   * @param {boolean} redirect - Whether to redirect to dashboard after deletion
   */
  const confirmDeleteCrawl = (crawlId, redirect = true) => {
    // Set the selected crawl in the store for the modal to use
    const crawl = crawlStore.allCrawls.find(c => c._id === crawlId)
    if (crawl) {
      crawlStore.setSelectedCrawl(crawl)
    }
    crawlStore.openDeleteCrawlConfirm()
  }

  /**
   * Delete a crawl (internal function)
   * @param {string} crawlId - The ID of the crawl to delete
   * @param {boolean} redirect - Whether to redirect to dashboard after deletion
   */
  const deleteCrawl = async (crawlId, redirect = true) => {
    try {
      setLoading(LOADING_KEYS.DELETE_CRAWL, true)
      await del(`/api/deletecrawl/${crawlId}`, {}, { silent: true })
      showNotification('Crawl deleted successfully', 'success')
      
      if (redirect) {
        router.push('/')
      }
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setLoading(LOADING_KEYS.DELETE_CRAWL, false)
    }
  }

  /**
   * Show clear crawl data confirmation
   * @param {string} crawlId - The ID of the crawl
   * @param {Function} onSuccess - Callback function to run after successful deletion
   */
  const confirmDeleteCrawlData = (crawlId, onSuccess = null) => {
    // Set the selected crawl in the store for the modal to use
    const crawl = crawlStore.allCrawls.find(c => c._id === crawlId)
    if (crawl) {
      crawlStore.setSelectedCrawl(crawl)
    }
    crawlStore.openClearDataConfirm()
  }

  /**
   * Clear all data for a crawl (internal function)
   * @param {string} crawlId - The ID of the crawl
   * @param {Function} onSuccess - Callback function to run after successful deletion
   */
  const deleteCrawlData = async (crawlId, onSuccess = null) => {
    try {
      const response = await del(`/api/deletecrawldata/${crawlId}`)
      showNotification(`Crawl data cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  /**
   * Show clear URL data confirmation
   * @param {string} crawlId - The ID of the crawl
   * @param {Array} urls - Array of URLs to clear data for
   * @param {Function} onSuccess - Callback function to run after successful deletion
   */
  const confirmDeleteUrlData = (crawlId, urls, onSuccess = null) => {
    // Set the selected crawl and URLs in the store for the modal to use
    const crawl = crawlStore.allCrawls.find(c => c._id === crawlId)
    if (crawl) {
      crawlStore.setSelectedCrawl(crawl)
      crawlStore.setSelectedUrls(urls)
    }
    crawlStore.openClearDataConfirm()
  }

  /**
   * Clear data for specific URLs (internal function)
   * @param {string} crawlId - The ID of the crawl
   * @param {Array} urls - Array of URLs to clear data for
   * @param {Function} onSuccess - Callback function to run after successful deletion
   */
  const deleteUrlData = async (crawlId, urls, onSuccess = null) => {
    try {
      const response = await del(`/api/deletecrawldata/${crawlId}/urls`, {
        data: { urls }
      })
      showNotification(`URL data cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  /**
   * Show clear crawl queue confirmation
   * @param {string} crawlId - The ID of the crawl
   * @param {Function} onSuccess - Callback function to run after successful clearing
   */
  const confirmClearCrawlQueue = (crawlId, onSuccess = null) => {
    // Set the selected crawl in the store for the modal to use
    const crawl = crawlStore.allCrawls.find(c => c._id === crawlId)
    if (crawl) {
      crawlStore.setSelectedCrawl(crawl)
    }
    crawlStore.openClearQueueConfirm()
  }

  /**
   * Clear the crawl queue (internal function)
   * @param {string} crawlId - The ID of the crawl
   * @param {Function} onSuccess - Callback function to run after successful clearing
   */
  const clearCrawlQueue = async (crawlId, onSuccess = null) => {
    try {
      setLoading(LOADING_KEYS.CLEAR_QUEUE, true)
      await del(`/api/clearqueue/${crawlId}`, {}, { silent: true })
      showNotification('Queue cleared successfully', 'success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setLoading(LOADING_KEYS.CLEAR_QUEUE, false)
    }
  }

  /**
   * Start or restart a crawl
   * @param {string} crawlId - The ID of the crawl
   * @param {Array} urls - Array of URLs to crawl (optional, will use crawl's URLs if not provided)
   * @param {Array} selectors - Array of selectors to use (optional, will use crawl's selectors if not provided)
   * @param {Function} onSuccess - Callback function to run after successful start
   */
  const startCrawl = async (crawlId, urls = [], selectors = [], onSuccess = null) => {
    try {
      const requestBody = {
        urls,
        crawlId,
        selectors
      }
      await post('/api/startcrawl', requestBody)
      showNotification('Crawl started successfully', 'success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  /**
   * Show restart selected URLs confirmation
   * @param {string} crawlId - The ID of the crawl
   * @param {Array} selectedUrls - Array of selected URLs to restart
   * @param {Array} selectors - Array of selectors to use
   * @param {Function} onSuccess - Callback function to run after successful restart
   */
  const confirmRestartSelectedUrls = (crawlId, selectedUrls, selectors = [], onSuccess = null) => {
    // Set the selected crawl and URLs in the store for the modal to use
    const crawl = crawlStore.allCrawls.find(c => c._id === crawlId)
    if (crawl) {
      crawlStore.setSelectedCrawl(crawl)
      crawlStore.setSelectedUrls(selectedUrls)
    }
    crawlStore.openRestartUrlsConfirm()
  }

  /**
   * Restart crawl for selected URLs (internal function)
   * @param {string} crawlId - The ID of the crawl
   * @param {Array} selectedUrls - Array of selected URLs to restart
   * @param {Array} selectors - Array of selectors to use
   * @param {Function} onSuccess - Callback function to run after successful restart
   */
  const restartSelectedUrls = async (crawlId, selectedUrls, selectors = [], onSuccess = null) => {
    try {
      const requestBody = {
        urls: selectedUrls,
        crawlId,
        selectors
      }
      await post('/api/startcrawl', requestBody)
      showNotification(`Restarted crawl for ${selectedUrls.length} selected URLs`, 'success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  /**
   * Open export modal for a crawl (Google Sheets or CSV with change tracking).
   * @param {string} crawlId - The ID of the crawl
   * @param {Object} options - Optional { title, onSuccess }
   */
  const exportCrawl = (crawlId, options = {}) => {
    const title = options?.title ?? ''
    crawlStore.setSelectedCrawl({ _id: crawlId, title })
    crawlStore.openExportModal()
    if (typeof options?.onSuccess === 'function') {
      options.onSuccess()
    }
  }

  /**
   * Refresh crawl data
   * @param {string} crawlId - The ID of the crawl (optional, will refresh all if not provided)
   */
  const refreshCrawl = (crawlId = null) => {
    if (crawlId) {
      // Refresh specific crawl
      crawlStore.triggerRefresh()
    } else {
      // Refresh all crawls
      crawlStore.triggerRefresh()
    }
  }

  /**
   * Open configure modal for a crawl
   * @param {string} crawlId - The ID of the crawl
   */
  const configureCrawl = (crawlId) => {
    showNotification('Opening configure modal...', 'info')
    // This would typically open a configure modal
  }

  /**
   * Fetch default selectors for a domain (authenticated).
   * On success returns { domain, hasSelectors: true, selectors }.
   * On any error (e.g. 404) returns { domain, hasSelectors: false, selectors: [] }.
   * @param {string} domain - The domain to fetch selectors for
   * @returns {Promise<{ domain: string, hasSelectors: boolean, selectors: Array }>}
   */
  const getDomainSelectors = async (domain) => {
    try {
      const data = await get(`/api/selectors/${domain}`, {}, { silent: true })
      return {
        domain,
        hasSelectors: true,
        selectors: data.selectors || []
      }
    } catch {
      return {
        domain,
        hasSelectors: false,
        selectors: []
      }
    }
  }

  return {
    // Loading states (centralized)
    clearQueueLoading: computed(() => isLoading(LOADING_KEYS.CLEAR_QUEUE)),
    deleteLoading: computed(() => isLoading(LOADING_KEYS.DELETE_CRAWL)),
    exportLoading: computed(() => isLoading(LOADING_KEYS.EXPORT_CRAWL)),
    
    // Confirmation actions (use these in components)
    confirmDeleteCrawl,
    confirmDeleteCrawlData,
    confirmDeleteUrlData,
    confirmClearCrawlQueue,
    confirmRestartSelectedUrls,
    
    // Direct actions (internal use)
    deleteCrawl,
    deleteCrawlData,
    deleteUrlData,
    clearCrawlQueue,
    startCrawl,
    restartSelectedUrls,
    exportCrawl,
    refreshCrawl,
    configureCrawl,
    getDomainSelectors
  }
}
