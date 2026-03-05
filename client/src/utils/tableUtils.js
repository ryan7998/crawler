/**
 * Table utility functions for data manipulation, filtering, sorting, and pagination
 * These functions are designed to be reusable across different table components
 */

/**
 * Filter an array of items based on a search query
 * @param {Array} items - Array of items to filter
 * @param {string} searchQuery - Search query string
 * @param {Array} searchFields - Array of field names to search in
 * @returns {Array} Filtered array of items
 */
export function filterItems(items, searchQuery, searchFields = []) {
  if (!searchQuery || !searchFields.length) {
    return items
  }

  const query = searchQuery.toLowerCase()
  return items.filter(item => 
    searchFields.some(field => {
      const value = item[field]
      return value && value.toString().toLowerCase().includes(query)
    })
  )
}

/**
 * Sort an array of items by a field
 * @param {Array} items - Array of items to sort
 * @param {string} sortField - Field name to sort by
 * @param {string} sortDirection - 'asc' or 'desc'
 * @returns {Array} Sorted array of items
 */
export function sortItems(items, sortField, sortDirection = 'asc') {
  if (!sortField) {
    return items
  }

  return [...items].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return sortDirection === 'asc' ? -1 : 1
    if (bVal == null) return sortDirection === 'asc' ? 1 : -1

    // Handle different data types
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Paginate an array of items
 * @param {Array} items - Array of items to paginate
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Array} Paginated array of items
 */
export function paginateItems(items, currentPage, itemsPerPage) {
  const start = (currentPage - 1) * itemsPerPage
  const end = start + itemsPerPage
  return items.slice(start, end)
}

/**
 * Calculate total pages for pagination
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {number} Total number of pages
 */
export function calculateTotalPages(totalItems, itemsPerPage) {
  return Math.ceil(totalItems / itemsPerPage)
}

/**
 * Generate visible page numbers for pagination UI
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} maxVisible - Maximum number of visible page buttons
 * @returns {Array} Array of page numbers and ellipsis strings
 */
export function generateVisiblePages(currentPage, totalPages, maxVisible = 7) {
  const pages = []
  
  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Show pages with ellipsis
    if (currentPage <= 4) {
      // Near the beginning
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // Near the end
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      // In the middle
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
}

/**
 * Get pagination info for display
 * @param {number} currentPage - Current page number
 * @param {number} itemsPerPage - Number of items per page
 * @param {number} totalItems - Total number of items
 * @returns {Object} Pagination info object
 */
export function getPaginationInfo(currentPage, itemsPerPage, totalItems) {
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)
  
  return {
    start,
    end,
    total: totalItems,
    showing: `${start} to ${end} of ${totalItems}`
  }
}

/**
 * Toggle sort direction for a field
 * @param {string} currentField - Current sort field
 * @param {string} newField - New field to sort by
 * @param {string} currentDirection - Current sort direction
 * @returns {Object} New sort field and direction
 */
export function toggleSort(currentField, newField, currentDirection) {
  if (currentField === newField) {
    return {
      field: newField,
      direction: currentDirection === 'asc' ? 'desc' : 'asc'
    }
  } else {
    return {
      field: newField,
      direction: 'asc'
    }
  }
}

/**
 * Create a comprehensive table data processor
 * Combines filtering, sorting, and pagination in one function
 * @param {Array} items - Array of items to process
 * @param {Object} options - Processing options
 * @param {string} options.searchQuery - Search query
 * @param {Array} options.searchFields - Fields to search in
 * @param {string} options.sortField - Field to sort by
 * @param {string} options.sortDirection - Sort direction
 * @param {number} options.currentPage - Current page
 * @param {number} options.itemsPerPage - Items per page
 * @returns {Object} Processed data with pagination info
 */
export function processTableData(items, options = {}) {
  const {
    searchQuery = '',
    searchFields = [],
    sortField = '',
    sortDirection = 'asc',
    currentPage = 1,
    itemsPerPage = 10
  } = options

  // Filter items
  const filtered = filterItems(items, searchQuery, searchFields)
  
  // Sort items
  const sorted = sortItems(filtered, sortField, sortDirection)
  
  // Paginate items
  const paginated = paginateItems(sorted, currentPage, itemsPerPage)
  
  // Calculate pagination info
  const totalPages = calculateTotalPages(filtered.length, itemsPerPage)
  const visiblePages = generateVisiblePages(currentPage, totalPages)
  const paginationInfo = getPaginationInfo(currentPage, itemsPerPage, filtered.length)
  
  return {
    items: paginated,
    filteredItems: filtered,
    totalPages,
    visiblePages,
    paginationInfo,
    hasResults: filtered.length > 0,
    isEmpty: filtered.length === 0
  }
}
