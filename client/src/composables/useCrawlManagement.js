import { ref, inject } from 'vue'
import { useApiService } from './useApiService'
import { useAuth } from './useAuth'
import { useCrawlStore } from '../stores/crawlStore'

/**
 * Composable for crawl management operations
 * Handles API calls and business logic, delegates UI state to components
 */
export function useCrawlManagement() {
    // Initialize composables
    const { get, post, put, loading: apiLoading, error: apiError } = useApiService()
    const { isAuthenticated } = useAuth()
    const crawlStore = useCrawlStore()

    // Business logic state only
    const isSearching = ref(false)
    const runAllLoading = ref(false)
    const disableLoadingId = ref(null)

    // Inject the notification function
    const showNotification = inject('showNotification')


    /**
     * Fetch crawls with pagination and search
     * @param {Object} options - Pagination options { page, itemsPerPage }
     * @param {string} searchQuery - Search query string
     */
    const fetchCrawls = async (options, searchQuery) => {
        if (!isAuthenticated.value) {
            crawlStore.setAllCrawls([])
            crawlStore.setCrawlsLoading(false)
            return
        }
        
        try {
            isSearching.value = true
            crawlStore.setCrawlsLoading(true)
            crawlStore.clearError()
            
            const { page, itemsPerPage } = options
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
            const url = `/api/getallcrawlers?page=${page}&limit=${itemsPerPage}${searchParam}`
            
            const data = await get(url)
            crawlStore.setAllCrawls(data.crawls)
            
        } catch (error) {
            console.error('Error fetching crawls:', error)
            crawlStore.setError(error.message || 'Error fetching crawls')
            showNotification('Error fetching crawls', 'error')
        } finally {
            isSearching.value = false
            crawlStore.setCrawlsLoading(false)
        }
    }

    /**
     * Run all crawls
     * @returns {Promise<Object>} Result object with success status and message
     */
    const runAllCrawls = async () => {
        if (!isAuthenticated.value) {
            showNotification('Please login to run crawls', 'error')
            return { success: false, message: 'Not authenticated' }
        }
        
        runAllLoading.value = true
        try {
            const data = await post('/api/runallcrawls')
            const { message, started, skipped } = data
            const resultMessage = `${message}. Started: ${started.length}, Skipped: ${skipped.length}`
            showNotification(resultMessage, 'success')
            return { success: true, message: resultMessage, data }
        } catch (error) {
            showNotification(error.message, 'error')
            return { success: false, message: error.message }
        } finally {
            runAllLoading.value = false
        }
    }

    /**
     * Toggle disable/enable crawl
     * @param {Object} item - Crawl item to toggle
     * @returns {Promise<Object>} Result object with success status and message
     */
    const toggleDisableCrawl = async (item) => {
        if (!isAuthenticated.value) {
            showNotification('Please login to manage crawls', 'error')
            return { success: false, message: 'Not authenticated' }
        }
        
        disableLoadingId.value = item._id
        try {
            const response = await put(`/api/updatecrawl/${item._id}`, { disabled: !item.disabled })
            const updated = response.data?.crawl
            
            if (!updated) {
                throw new Error('No updated crawl data received from server')
            }
            
            // Update store
            crawlStore.updateCrawl(updated)
            
            const message = updated.disabled ? 'Crawl disabled' : 'Crawl enabled'
            showNotification(message, 'success')
            return { success: true, message, data: updated }
        } catch (error) {
            showNotification(error.message, 'error')
            return { success: false, message: error.message }
        } finally {
            disableLoadingId.value = null
        }
    }

    return {
        // Business logic state
        isSearching,
        runAllLoading,
        disableLoadingId,
        
        // Functions
        fetchCrawls,
        runAllCrawls,
        toggleDisableCrawl
    }
} 