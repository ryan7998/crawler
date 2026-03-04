import { ref, watch } from 'vue'
import { useSocketConnection } from './useSocketConnection'
import { debounce, throttle } from '../utils/performanceUtils'

/**
 * Composable for managing crawl-specific socket connections and events
 * @param {Object} crawlId - The crawl ID
 * @param {Object} crawl - The crawl object
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Function} updateLiveStatus - Function to update live status
 * @returns {Object} Socket state and methods
 */
export function useCrawlSocket(crawlId, crawl, liveStatusDictionary, updateLiveStatus) {
  const { joinRoom, on, disconnect } = useSocketConnection()
  
  // State
  const isConnected = ref(false)
  const logs = ref([])
  const queueStatus = ref({ active: 0, waiting: 0, delayed: 0, total: 0 })

  // Create debounced status update function
  const debouncedStatusUpdate = debounce((url, status) => {
    updateLiveStatus(url, status)
  }, 100)

  // Create throttled log update function
  const throttledLogUpdate = throttle((data) => {
    logs.value.push(data)
  }, 50)

  // Methods
  const setupSocketListeners = () => {
    on("crawlLog", async (data) => {
      throttledLogUpdate(data)
      
      if (data.status === 'completed' || data.status === 'failed') {
        crawl.value.status = data.status
        clearStartedStatuses()
      } else if (data.url) {
        debouncedStatusUpdate(data.url, data.status)
      }

      if (data.status === 'success') {
        if (!crawl.value.aggregatedData[data.url]) {
          crawl.value.aggregatedData[data.url] = []
        }
        crawl.value.aggregatedData[data.url]
          .push({ data: data.result, date: new Date(), status: data.status })
      }
    })

    on("queueStatus", (data) => {
      queueStatus.value = {
        active: data.active ?? 0,
        waiting: data.waiting ?? 0,
        delayed: data.delayed ?? 0,
        total: (data.active ?? 0) + (data.waiting ?? 0) + (data.delayed ?? 0)
      }
    })
  }

  const clearStartedStatuses = () => {
    // Clear all 'started' statuses when crawl completes
    Object.keys(liveStatusDictionary.value).forEach(url => {
      if (liveStatusDictionary.value[url] === 'started') {
        // Check if this URL has a final status in aggregatedData
        const urlData = crawl.value.aggregatedData[url]
        if (urlData && urlData.length > 0) {
          const lastEntry = urlData[urlData.length - 1]
          liveStatusDictionary.value[url] = lastEntry.status
        } else {
          // If no data, mark as failed
          liveStatusDictionary.value[url] = 'failed'
        }
      }
    })
  }

  const connectToCrawl = async () => {
    try {
      await joinRoom(crawlId.value)
      isConnected.value = true
      setupSocketListeners()
    } catch (error) {
      console.error('Failed to connect to crawl room:', error)
      isConnected.value = false
    }
  }

  const disconnectFromCrawl = () => {
    disconnect()
    isConnected.value = false
  }

  // Watch for crawlId changes to reconnect
  watch(crawlId, (newCrawlId, oldCrawlId) => {
    if (newCrawlId && newCrawlId !== oldCrawlId) {
      connectToCrawl()
    }
  })

  return {
    // State
    isConnected,
    logs,
    queueStatus,
    
    // Methods
    connectToCrawl,
    disconnectFromCrawl,
    setupSocketListeners,
    clearStartedStatuses
  }
}
