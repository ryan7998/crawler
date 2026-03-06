/**
 * Comprehensive utility functions for URL management and display
 * Consolidates all URL-related functionality from across the application
 */

/**
 * Truncate a URL for display (simple version)
 * @param {string} url - The URL to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated URL
 */
export function truncateUrl(url, maxLength = 50) {
  if (!url || url.length <= maxLength) {
    return url
  }
  
  const start = url.substring(0, maxLength - 3)
  return `${start}...`
}

/**
 * Format URL for display (advanced version that preserves protocol/domain)
 * @param {string} url - URL to format
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Formatted URL
 */
export function formatUrl(url, maxLength = 50) {
  if (!url) return 'N/A'
  if (url.length <= maxLength) return url
  
  const protocol = url.match(/^https?:\/\//)?.[0] || ''
  const domain = url.replace(/^https?:\/\//, '').split('/')[0]
  const path = url.replace(/^https?:\/\/[^\/]+/, '')
  
  if (protocol + domain.length <= maxLength) {
    return protocol + domain + (path ? '...' : '')
  }
  
  return truncateUrl(url, maxLength)
}

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (error) {
    return url
  }
}

/**
 * Check if URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Check if URL should be truncated based on length
 * @param {string} url - The URL to check
 * @param {number} maxLength - Maximum length threshold
 * @returns {boolean} Whether URL needs truncation
 */
export function needsTruncation(url, maxLength = 30) {
  return url && url.length > maxLength
}

/**
 * Generate URL excerpt for display
 * @param {string} url - The URL to generate excerpt for
 * @param {number} maxLength - Maximum length for excerpt
 * @returns {Object} Excerpt object with text and metadata
 */
export function generateUrlExcerpt(url, maxLength = 30) {
  if (!url) {
    return { excerpt: '', isExpanded: false, needsToggle: false }
  }
  
  const needsToggle = url.length > maxLength
  const excerpt = needsToggle ? url.substring(0, maxLength) : url
  
  return {
    excerpt,
    isExpanded: false,
    needsToggle,
    fullUrl: url
  }
}

/**
 * Toggle URL excerpt expansion
 * @param {Object} excerptObj - The excerpt object
 * @returns {Object} Updated excerpt object
 */
export function toggleUrlExcerpt(excerptObj) {
  if (!excerptObj.needsToggle) {
    return excerptObj
  }
  
  return {
    ...excerptObj,
    isExpanded: !excerptObj.isExpanded,
    excerpt: excerptObj.isExpanded ? 
      excerptObj.fullUrl.substring(0, 30) : 
      excerptObj.fullUrl
  }
}

/**
 * Get URL display text based on excerpt state
 * @param {Object} excerptObj - The excerpt object
 * @returns {string} Display text
 */
export function getUrlDisplayText(excerptObj) {
  return excerptObj?.excerpt || excerptObj?.fullUrl || ''
}

/**
 * Check if URL should show toggle button
 * @param {Object} excerptObj - The excerpt object
 * @returns {boolean} Whether to show toggle button
 */
export function shouldShowUrlToggle(excerptObj) {
  return excerptObj?.needsToggle || false
}

/**
 * Parse a whitespace/newline-separated block of text into an array of URL strings.
 * @param {string} text - Raw textarea value
 * @returns {string[]} Trimmed, non-empty URL strings
 */
export function parseUrls(text) {
  return (text || '').split(/[\s\n]+/).map(u => u.trim()).filter(u => u.length > 0)
}

/**
 * Return the single shared hostname if every URL in the array belongs to the
 * same domain, otherwise return null.
 * @param {string[]} urls - Array of URL strings
 * @returns {string|null} Shared hostname or null
 */
export function getSingleDomain(urls) {
  const getDomain = (url) => {
    try { return new URL(url).hostname } catch { return null }
  }
  const domains = urls.map(getDomain).filter(Boolean)
  if (domains.length === 0) return null
  const first = domains[0]
  return domains.every(d => d === first) ? first : null
}
