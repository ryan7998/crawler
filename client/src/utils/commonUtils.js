/**
 * Common utility functions used across the application
 * Focused on environment configuration and validation utilities
 */

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
