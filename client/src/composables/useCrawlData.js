import { ref, computed } from 'vue'
import { useApiService } from './useApiService'
import { useExcerpts } from './useExcerpts'
import { useStatsBarContext } from './useStatsBarContext'

/**
 * Composable for managing crawl data fetching and initialization
 * Handles data fetching, excerpts setup, and context management
 */
export function useCrawlData() {
  const { get } = useApiService()
  const { setContext } = useStatsBarContext()

  const crawl = ref(null)
  const errorMessage = ref('')
  const excerpts = ref({})
  const liveStatusDictionary = ref({})

  /**
   * Computed property to check if crawl has data
   */
  const hasCrawlData = computed(() => {
    if (!crawl.value?.aggregatedData) return false
    return Object.values(crawl.value.aggregatedData).some(urlData => urlData && urlData.length > 0)
  })

  /**
   * Clear live status dictionary
   */
  const clearLiveStatusDictionary = () => {
    liveStatusDictionary.value = {}
  }

  /**
   * Update live status for a specific URL
   */
  const updateLiveStatus = (url, status) => {
    if (url) {
      liveStatusDictionary.value[url] = status
    }
  }

  /**
   * Fetch crawl data and initialize all related state
   * @param {string} crawlId - The ID of the crawl to fetch
   */
  const fetchCrawlData = async (crawlId) => {
    try {
      const data = await get(`/api/getcrawler/${crawlId}`)
      crawl.value = data

      // Initialize aggregatedData if it doesn't exist
      if (!crawl.value.aggregatedData) {
        crawl.value.aggregatedData = {}
      }

      // Initialize excerpts for each URL
      crawl.value.urls.forEach((url) => {
        // Initialize aggregatedData for this URL if it doesn't exist
        if (!crawl.value.aggregatedData[url]) {
          crawl.value.aggregatedData[url] = []
        }
        // Initialize excerpt
        excerpts.value[url] = useExcerpts(ref(url), 30)
      })

      // Set stats bar context for this specific crawl
      setContext('crawl-details', {
        crawlId: crawlId,
        title: crawl.value.title,
        status: crawl.value.status,
        totalUrls: crawl.value.urls?.length || 0,
        completedUrls: Object.values(crawl.value.aggregatedData || {})
          .filter(urlData => urlData && urlData.length > 0)
          .length,
        failedUrls: Object.values(crawl.value.aggregatedData || {})
          .filter(urlData => urlData && urlData.length > 0 && 
            urlData[urlData.length - 1]?.status === 'failed')
          .length,
        hasData: hasCrawlData.value
      })

      // Clear any stale 'started' statuses if crawl is completed
      if (crawl.value.status === 'completed' || crawl.value.status === 'failed') {
        clearLiveStatusDictionary()
      }
    } catch (error) {
      errorMessage.value = error.message
      throw error
    }
  }

  /**
   * Refresh crawl data
   * @param {string} crawlId - The ID of the crawl to refresh
   */
  const refreshCrawlData = async (crawlId) => {
    await fetchCrawlData(crawlId)
  }

  return {
    // State
    crawl,
    errorMessage,
    excerpts,
    liveStatusDictionary,
    
    // Computed
    hasCrawlData,
    
    // Methods
    fetchCrawlData,
    refreshCrawlData,
    clearLiveStatusDictionary,
    updateLiveStatus
  }
}
