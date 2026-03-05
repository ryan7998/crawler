/**
 * Utility functions for handling crawl status logic
 */
import { CRAWL_STATUSES, URL_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../constants/crawlDetailsConstants'

/**
 * Get the current status for a URL
 * @param {string} url - The URL to check
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Object} crawl - The crawl object
 * @returns {Object} Status information with type and data
 */
export function getUrlStatus(url, liveStatusDictionary, crawl) {
  // Check if URL is currently being processed
  if (liveStatusDictionary?.[url] === URL_STATUSES.STARTED && 
      crawl?.status !== CRAWL_STATUSES.COMPLETED && 
      crawl?.status !== CRAWL_STATUSES.FAILED) {
    return { 
      type: 'loading', 
      text: STATUS_LABELS[URL_STATUSES.STARTED],
      isProcessing: true
    }
  }
  
  // Get the actual status
  const status = liveStatusDictionary[url] || 
    crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.status || 
    URL_STATUSES.PENDING
  
  return { 
    type: 'status', 
    status,
    isProcessing: false
  }
}

/**
 * Clear all 'started' statuses when crawl completes
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Object} crawl - The crawl object
 */
export function clearStartedStatuses(liveStatusDictionary, crawl) {
  Object.keys(liveStatusDictionary.value).forEach(url => {
    if (liveStatusDictionary.value[url] === URL_STATUSES.STARTED) {
      const urlData = crawl.value.aggregatedData[url]
      if (urlData && urlData.length > 0) {
        const lastEntry = urlData[urlData.length - 1]
        liveStatusDictionary.value[url] = lastEntry.status
      } else {
        // If no data, mark as failed
        liveStatusDictionary.value[url] = URL_STATUSES.FAILED
      }
    }
  })
}

/**
 * Check if a URL has data
 * @param {string} url - The URL to check
 * @param {Object} crawl - The crawl object
 * @returns {boolean} Whether the URL has data
 */
export function hasUrlData(url, crawl) {
  return crawl?.aggregatedData?.[url] && crawl.aggregatedData[url].length > 0
}

/**
 * Get the final status for a URL
 * @param {string} url - The URL to check
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Object} crawl - The crawl object
 * @returns {string} The final status
 */
export function getFinalUrlStatus(url, liveStatusDictionary, crawl) {
  return liveStatusDictionary[url] || 
    crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.status || 
    'pending'
}

/**
 * Check if crawl is in a final state
 * @param {Object} crawl - The crawl object
 * @returns {boolean} Whether the crawl is in a final state
 */
export function isCrawlInFinalState(crawl) {
  return crawl?.status === 'completed' || crawl?.status === 'failed'
}

/**
 * Get crawl status display information
 * @param {Object} crawl - The crawl object
 * @returns {Object} Status display information
 */
export function getCrawlStatusInfo(crawl) {
  const status = crawl?.status || 'loading'
  
  const statusMap = {
    'loading': { color: 'gray', text: 'Loading...' },
    'pending': { color: 'yellow', text: 'Pending' },
    'in-progress': { color: 'blue', text: 'In Progress' },
    'completed': { color: 'green', text: 'Completed' },
    'failed': { color: 'red', text: 'Failed' }
  }
  
  return statusMap[status] || { color: 'gray', text: 'Unknown' }
}
