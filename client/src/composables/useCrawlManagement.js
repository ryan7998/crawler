import { ref, inject } from 'vue'
import axios from 'axios'
import { getApiUrl } from '../utils/commonUtils.js'

export function useCrawlManagement() {
    // Reactive state
    const crawls = ref([])
    const totalCrawls = ref(0)
    const isSearching = ref(false)
    const runAllLoading = ref(false)
    const disableLoadingId = ref(null)
    const showSnackbar = ref(false)
    const snackbarText = ref('')
    const snackbarColor = ref('success')

    // Inject the notification function
    const showNotification = inject('showNotification')

    // Fetch crawls with pagination and search
    const fetchCrawls = async (options, searchQuery) => {
        try {
            isSearching.value = true
            const { page, itemsPerPage } = options
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
            const response = await axios.get(`${getApiUrl()}/api/getallcrawlers?page=${page}&limit=${itemsPerPage}${searchParam}`)
            crawls.value = response.data.crawls
            totalCrawls.value = response.data.totalCrawls
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
            const response = await axios.post(`${getApiUrl()}/api/runallcrawls`)
            const { message, started, skipped } = response.data
            snackbarText.value = `${message}. Started: ${started.length}, Skipped: ${skipped.length}`
            snackbarColor.value = 'success'
            showSnackbar.value = true
        } catch (error) {
            snackbarText.value = error.response?.data?.message || 'Failed to start all crawls'
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
            const response = await axios.put(`${getApiUrl()}/api/updatecrawl/${item._id}`,
                { disabled: !item.disabled })
            // Update the local crawl list
            const updated = response.data.crawl
            const idx = crawls.value.findIndex(c => c._id === item._id)
            if (idx !== -1) crawls.value[idx] = { ...crawls.value[idx], ...updated }
            snackbarText.value = updated.disabled ? 'Crawl disabled' : 'Crawl enabled'
            snackbarColor.value = 'success'
            showSnackbar.value = true
        } catch (error) {
            snackbarText.value = error.response?.data?.message || 'Failed to update crawl'
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
        
        // Functions
        fetchCrawls,
        runAllCrawls,
        toggleDisableCrawl
    }
} 