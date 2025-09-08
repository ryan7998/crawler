/**
 * Validation utilities
 * Handles URL validation, filename sanitization, and other validation functions
 */

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
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
 * Validate that a value is not empty
 * @param {any} value - Value to validate
 * @returns {boolean} Whether value is not empty
 */
export const isNotEmpty = (value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
}

/**
 * Validate that a value is a positive number
 * @param {any} value - Value to validate
 * @returns {boolean} Whether value is a positive number
 */
export const isPositiveNumber = (value) => {
    const num = Number(value)
    return !isNaN(num) && num > 0
}

/**
 * Validate that a value is within a range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Whether value is within range
 */
export const isInRange = (value, min, max) => {
    const num = Number(value)
    return !isNaN(num) && num >= min && num <= max
}
