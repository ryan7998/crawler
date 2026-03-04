/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Memoize function results to avoid expensive recalculations
 * @param {Function} func - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Memoized function
 */
export function memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
  const cache = new Map()
  
  return function memoizedFunction(...args) {
    const key = keyGenerator(...args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = func.apply(this, args)
    cache.set(key, result)
    return result
  }
}

/**
 * Create a shallow comparison function for objects
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} Whether objects are shallowly equal
 */
export function shallowEqual(obj1, obj2) {
  if (obj1 === obj2) return true
  
  if (obj1 == null || obj2 == null) return false
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }
  
  return true
}

/**
 * Create a deep comparison function for objects
 * @param {any} obj1 - First value
 * @param {any} obj2 - Second value
 * @returns {boolean} Whether values are deeply equal
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true
  
  if (obj1 == null || obj2 == null) return false
  
  if (typeof obj1 !== typeof obj2) return false
  
  if (typeof obj1 !== 'object') return obj1 === obj2
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }
  
  return true
}

/**
 * Create a virtual scrolling utility for large lists
 * @param {Array} items - Array of items
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @param {number} scrollTop - Current scroll position
 * @returns {Object} Virtual scrolling data
 */
export function createVirtualScroll(items, itemHeight, containerHeight, scrollTop) {
  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleCount, items.length)
  
  return {
    totalHeight,
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight
  }
}

/**
 * Batch DOM updates to improve performance
 * @param {Function} updateFunction - Function containing DOM updates
 */
export function batchDOMUpdates(updateFunction) {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    updateFunction()
  })
}

/**
 * Create a performance monitor for measuring function execution time
 * @param {string} label - Label for the measurement
 * @returns {Function} Function to end the measurement
 */
export function performanceMonitor(label) {
  const start = performance.now()
  
  return () => {
    const end = performance.now()
    const duration = end - start
    console.log(`${label}: ${duration.toFixed(2)}ms`)
    return duration
  }
}

/**
 * Create a lazy loading utility for images
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {Object} Lazy loading state
 */
export function createLazyImage(src, placeholder = '') {
  const state = {
    src: placeholder,
    loading: true,
    error: false
  }
  
  const img = new Image()
  
  img.onload = () => {
    state.src = src
    state.loading = false
    state.error = false
  }
  
  img.onerror = () => {
    state.loading = false
    state.error = true
  }
  
  img.src = src
  
  return state
}

/**
 * Create a pagination utility for large datasets
 * @param {Array} data - Array of data
 * @param {number} pageSize - Number of items per page
 * @param {number} currentPage - Current page number
 * @returns {Object} Pagination data
 */
export function createPagination(data, pageSize, currentPage = 1) {
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const items = data.slice(startIndex, endIndex)
  
  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex,
    endIndex
  }
}
