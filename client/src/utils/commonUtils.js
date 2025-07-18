/**
 * Common utility functions used across the application
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
}

/**
 * Format date and time to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
}

/**
 * Get API base URL with fallback
 * @returns {string} API base URL
 */
export const getApiUrl = () => {
    return import.meta.env.VITE_BASE_URL || 'http://localhost:3001'
}

/**
 * Get Socket URL with fallback
 * @returns {string} Socket URL
 */
export const getSocketUrl = () => {
    return import.meta.env.VITE_BASE_URL || 'http://localhost:3002'
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export const isValidUrl = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()
}

/**
 * Get relative time from a date (e.g., "2 days ago", "3 hours ago")
 * @param {Date|string} date - Date to get relative time for
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const past = new Date(date)
    const diffInMs = now - past
    
    const diffInSeconds = Math.floor(diffInMs / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)
    
    if (diffInSeconds < 60) {
        return 'Just now'
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    } else if (diffInWeeks < 4) {
        return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
    } else if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    } else {
        return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
    }
} 