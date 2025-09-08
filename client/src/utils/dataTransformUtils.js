/**
 * Data transformation utilities for export functionality
 * Handles data formatting, flattening, and preparation for export
 */

/**
 * Format selectors for better readability in exports
 * @param {Array} selectors - Array of selectors
 * @returns {string} Formatted selectors string
 */
export const formatSelectors = (selectors) => {
  if (!selectors || !Array.isArray(selectors)) return ''
  
  return selectors.map(selector => {
    if (typeof selector === 'string') {
      return selector
    } else if (typeof selector === 'object' && selector !== null) {
      // Format selector object
      const parts = []
      if (selector.name) parts.push(`Name: ${selector.name}`)
      if (selector.selector) parts.push(`Selector: ${selector.selector}`)
      if (selector.attribute) parts.push(`Attribute: ${selector.attribute}`)
      if (selector.type) parts.push(`Type: ${selector.type}`)
      return parts.join(' | ')
    }
    return String(selector)
  }).join('; ')
}

/**
 * Flatten nested objects and arrays for export
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Key prefix
 * @returns {Object} Flattened object
 */
export const flattenObject = (obj, prefix = '') => {
  const flattened = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    
    if (value === null || value === undefined) {
      flattened[newKey] = ''
    } else if (key === 'selectors' && Array.isArray(value)) {
      // Special handling for selectors
      flattened[newKey] = formatSelectors(value)
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey))
    } else if (Array.isArray(value)) {
      // Handle arrays - join with semicolon or flatten if objects
      if (value.length === 0) {
        flattened[newKey] = ''
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        // If array contains objects, flatten them
        const flattenedArray = value.map((item, index) => {
          if (typeof item === 'object' && item !== null) {
            return flattenObject(item, `${newKey}_${index + 1}`)
          }
          return item
        })
        Object.assign(flattened, ...flattenedArray)
      } else {
        // Simple array - join with semicolon
        flattened[newKey] = value.join('; ')
      }
    } else {
      // Simple value
      flattened[newKey] = value
    }
  }
  
  return flattened
}

/**
 * Prepare crawl data for export
 * @param {Object} crawl - Crawl object with aggregated data
 * @returns {Array} Array of export data rows
 */
export const prepareCrawlExportData = (crawl) => {
  const exportData = []
  
  if (!crawl?.urls || !crawl?.aggregatedData) {
    return exportData
  }
  
  // For each URL in the crawl
  crawl.urls.forEach(url => {
    const urlData = crawl.aggregatedData[url]
    if (!urlData || !urlData.length) return

    // Process each historical entry for this URL
    urlData.forEach(entry => {
      const row = {
        'URL': url,
        'Crawl Date': new Date(entry.date).toLocaleString(),
        'Status': entry.status
      }

      // Add error message if available
      if (entry.error) {
        row['Error Message'] = entry.error
      }

      // Add data if available - flatten nested objects
      if (entry.data && typeof entry.data === 'object') {
        const flattenedData = flattenObject(entry.data)
        Object.assign(row, flattenedData)
      } else if (entry.data) {
        // If data is a simple value, add it directly
        row['Data'] = entry.data
      }

      exportData.push(row)
    })
  })

  // Sort by URL and then by date (newest first)
  return exportData.sort((a, b) => {
    if (a.URL === b.URL) {
      return new Date(b['Crawl Date']) - new Date(a['Crawl Date'])
    }
    return a.URL.localeCompare(b.URL)
  })
}
