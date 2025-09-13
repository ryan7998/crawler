/**
 * Utility functions for table operations and data processing
 */
import { extractDomain } from './urlUtils'

/**
 * Process table data for display
 * @param {Array} urls - Array of URLs
 * @param {Object} excerpts - Excerpts object
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Object} crawl - The crawl object
 * @returns {Array} Processed table data
 */
export function processTableData(urls, excerpts, liveStatusDictionary, crawl) {
  if (!urls || !Array.isArray(urls)) {
    return []
  }
  
  return urls.map(url => ({
    url,
    excerpt: excerpts[url]?.excerpt || url,
    isExpanded: excerpts[url]?.isExpanded || false,
    needsToggle: url.length > 30,
    status: getUrlStatus(url, liveStatusDictionary, crawl),
    hasData: hasUrlData(url, crawl),
    domain: extractDomain(url)
  }))
}

/**
 * Get URL status for table display
 * @param {string} url - The URL
 * @param {Object} liveStatusDictionary - Live status dictionary
 * @param {Object} crawl - The crawl object
 * @returns {Object} Status information
 */
function getUrlStatus(url, liveStatusDictionary, crawl) {
  if (liveStatusDictionary?.[url] === 'started' && 
      crawl?.status !== 'completed' && 
      crawl?.status !== 'failed') {
    return { type: 'loading', text: 'Processing...' }
  }
  
  const status = liveStatusDictionary[url] || 
    crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.status || 
    'pending'
  
  return { type: 'status', status }
}

/**
 * Check if URL has data
 * @param {string} url - The URL
 * @param {Object} crawl - The crawl object
 * @returns {boolean} Whether URL has data
 */
function hasUrlData(url, crawl) {
  return crawl?.aggregatedData?.[url] && crawl.aggregatedData[url].length > 0
}

// extractDomain moved to urlUtils.js to avoid duplication

/**
 * Get bulk actions configuration
 * @param {number} selectedCount - Number of selected items
 * @returns {Object} Bulk actions configuration
 */
export function getBulkActionsConfig(selectedCount) {
  return {
    show: selectedCount > 0,
    count: selectedCount,
    actions: [
      { 
        key: 'delete', 
        label: 'Clear Selected', 
        variant: 'yellow',
        icon: 'trash'
      },
      { 
        key: 'restart', 
        label: 'Restart Selected', 
        variant: 'blue',
        icon: 'refresh'
      }
    ]
  }
}

/**
 * Get table headers configuration
 * @returns {Array} Table headers configuration
 */
export function getTableHeaders() {
  return [
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
  ]
}

/**
 * Get row actions configuration
 * @param {boolean} hasData - Whether the row has data
 * @returns {Array} Row actions configuration
 */
export function getRowActions(hasData) {
  const actions = [
    {
      key: 'view',
      label: 'View',
      variant: 'indigo',
      icon: 'eye'
    }
  ]
  
  if (hasData) {
    actions.push({
      key: 'clear',
      label: 'Clear',
      variant: 'red',
      icon: 'trash'
    })
  }
  
  return actions
}

/**
 * Filter table data
 * @param {Array} data - Table data
 * @param {string} searchTerm - Search term
 * @param {string} statusFilter - Status filter
 * @returns {Array} Filtered data
 */
export function filterTableData(data, searchTerm = '', statusFilter = '') {
  let filtered = data
  
  if (searchTerm) {
    filtered = filtered.filter(item => 
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  
  if (statusFilter) {
    filtered = filtered.filter(item => {
      if (item.status.type === 'loading') {
        return statusFilter === 'processing'
      }
      return item.status.status === statusFilter
    })
  }
  
  return filtered
}

/**
 * Sort table data
 * @param {Array} data - Table data
 * @param {string} sortKey - Sort key
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted data
 */
export function sortTableData(data, sortKey, sortOrder = 'asc') {
  if (!sortKey) return data
  
  return [...data].sort((a, b) => {
    let aValue = a[sortKey]
    let bValue = b[sortKey]
    
    // Handle nested properties
    if (sortKey === 'status') {
      aValue = a.status.status || a.status.text || ''
      bValue = b.status.status || b.status.text || ''
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : -1
    }
    
    return aValue > bValue ? 1 : -1
  })
}
