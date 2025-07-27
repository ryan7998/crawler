import { ref, inject } from 'vue'
import { useApiService } from './useApiService'

export function useCrawlManagement() {
    // Initialize composables
    const { get, post, put, loading: apiLoading, error: apiError } = useApiService()

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
    setTimeout(() => {
        fetchGoogleSheetUrl()
    }, 100)

    // Fetch crawls with pagination and search
    const fetchCrawls = async (options, searchQuery) => {
        try {
            isSearching.value = true
            const { page, itemsPerPage } = options
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
            const data = await get(`/api/getallcrawlers?page=${page}&limit=${itemsPerPage}${searchParam}`)
            crawls.value = data.crawls
            totalCrawls.value = data.totalCrawls
        } catch (error) {
            console.error('Error fetching crawls:', error)
            showNotification('Error fetching crawls', 'error')
        } finally {
            isSearching.value = false
        }
    }

    // Run all crawls
    const runAllCrawls = async () => {
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
        disableLoadingId.value = item._id
        try {
            const data = await put(`/api/updatecrawl/${item._id}`,
                { disabled: !item.disabled })
            // Update the local crawl list
            const updated = data.crawl
            const idx = crawls.value.findIndex(c => c._id === item._id)
            if (idx !== -1) crawls.value[idx] = { ...crawls.value[idx], ...updated }
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