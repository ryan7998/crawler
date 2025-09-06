import { ref, inject } from 'vue'
import { useApiService } from './useApiService'
import { useAuth } from './useAuth'
import { useCrawlStore } from '../stores/crawlStore'

export function useCrawlManagement() {
    // Initialize composables
    const { get, post, put, loading: apiLoading, error: apiError } = useApiService()
    const { isAuthenticated } = useAuth()
    const crawlStore = useCrawlStore()

    // Reactive state
    const crawls = ref([])
    const totalCrawls = ref(0)
    const isSearching = ref(false)
    const runAllLoading = ref(false)
    const disableLoadingId = ref(null)
    const showSnackbar = ref(false)
    const snackbarText = ref('')
    const snackbarColor = ref('success')
    const globalSheetUrl = ref('')

    // Inject the notification function
    const showNotification = inject('showNotification')

    // Fetch Google Sheet URL from server
    const fetchGoogleSheetUrl = async () => {
        try {
            const data = await get('/api/export/google-sheet-id')
            globalSheetUrl.value = data.sheetUrl
        } catch (error) {
            console.error('Error fetching Google Sheet URL:', error)
            // Don't show notification for this as it's not critical
            // Set a default value to prevent undefined issues
            globalSheetUrl.value = ''
        }
    }

    // Initialize Google Sheet URL - make it non-blocking
    // Use setTimeout to avoid blocking the component initialization
    // Only fetch if user is authenticated
    setTimeout(() => {
        if (isAuthenticated.value) {
            fetchGoogleSheetUrl()
        }
    }, 100)

    // Fetch crawls with pagination and search
    const fetchCrawls = async (options, searchQuery) => {
        console.log('useCrawlManagement: fetchCrawls called, isAuthenticated:', isAuthenticated.value)
        if (!isAuthenticated.value) {
            console.log('useCrawlManagement: User not authenticated, clearing crawls')
            crawls.value = []
            totalCrawls.value = 0
            // Clear store as well
            crawlStore.setAllCrawls([])
            return
        }
        
        try {
            console.log('useCrawlManagement: Starting to fetch crawls...')
            isSearching.value = true
            crawlStore.setCrawlsLoading(true) // Sync loading state with store
            const { page, itemsPerPage } = options
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
            const url = `/api/getallcrawlers?page=${page}&limit=${itemsPerPage}${searchParam}`
            console.log('useCrawlManagement: Fetching from URL:', url)
            const data = await get(url)
            console.log('useCrawlManagement: Received data:', data)
            crawls.value = data.crawls
            totalCrawls.value = data.totalCrawls
            
            // Sync with store
            crawlStore.setAllCrawls(data.crawls)
            
            console.log('useCrawlManagement: Set crawls to:', crawls.value.length, 'items')
        } catch (error) {
            console.error('useCrawlManagement: Error fetching crawls:', error)
            showNotification('Error fetching crawls', 'error')
        } finally {
            isSearching.value = false
            crawlStore.setCrawlsLoading(false) // Sync loading state with store
        }
    }

    // Run all crawls
    const runAllCrawls = async () => {
        if (!isAuthenticated.value) {
            snackbarText.value = 'Please login to run crawls'
            snackbarColor.value = 'error'
            showSnackbar.value = true
            return
        }
        
        runAllLoading.value = true
        try {
            const data = await post('/api/runallcrawls')
            const { message, started, skipped } = data
            snackbarText.value = `${message}. Started: ${started.length}, Skipped: ${skipped.length}`
            snackbarColor.value = 'success'
            showSnackbar.value = true
        } catch (error) {
            snackbarText.value = error.message
            snackbarColor.value = 'error'
            showSnackbar.value = true
        } finally {
            runAllLoading.value = false
        }
    }

    // Toggle disable/enable crawl
    const toggleDisableCrawl = async (item) => {
        if (!isAuthenticated.value) {
            snackbarText.value = 'Please login to manage crawls'
            snackbarColor.value = 'error'
            showSnackbar.value = true
            return
        }
        
        disableLoadingId.value = item._id
        try {
            const data = await put(`/api/updatecrawl/${item._id}`,
                { disabled: !item.disabled })
            // Update the local crawl list
            const updated = data.crawl
            const idx = crawls.value.findIndex(c => c._id === item._id)
            if (idx !== -1) crawls.value[idx] = { ...crawls.value[idx], ...updated }
            
            // Sync with store
            crawlStore.updateCrawl(updated)
            snackbarText.value = updated.disabled ? 'Crawl disabled' : 'Crawl enabled'
            snackbarColor.value = 'success'
            showSnackbar.value = true
        } catch (error) {
            snackbarText.value = error.message
            snackbarColor.value = 'error'
            showSnackbar.value = true
        } finally {
            disableLoadingId.value = null
        }
    }

    return {
        // State
        crawls,
        totalCrawls,
        isSearching,
        runAllLoading,
        disableLoadingId,
        showSnackbar,
        snackbarText,
        snackbarColor,
        globalSheetUrl,
        
        // Functions
        fetchCrawls,
        runAllCrawls,
        toggleDisableCrawl
    }
} 