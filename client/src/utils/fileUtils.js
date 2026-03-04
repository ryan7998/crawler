/**
 * File management utilities
 * Handles filename generation and export metadata management
 */

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (without dot)
 * @returns {string} Generated filename
 */
export const generateFilename = (prefix = 'export', extension = 'xlsx') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Save export metadata to localStorage
 * @param {string} crawlId - Crawl ID
 * @param {Object} exportData - Export metadata
 */
export const saveExportMetadata = (crawlId, exportData) => {
  try {
    localStorage.setItem(`export_${crawlId}`, JSON.stringify({
      ...exportData,
      exportDate: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error saving export metadata:', error)
  }
}

/**
 * Load export metadata from localStorage
 * @param {string} crawlId - Crawl ID
 * @returns {Object|null} Export metadata or null
 */
export const loadExportMetadata = (crawlId) => {
  try {
    const saved = localStorage.getItem(`export_${crawlId}`)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Error loading export metadata:', error)
    return null
  }
}
