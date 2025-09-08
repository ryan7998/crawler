/**
 * Environment configuration utilities
 * Handles API and Socket URL configuration with fallbacks
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
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value or fallback
 */
export const getEnvVar = (key, fallback = '') => {
    return import.meta.env[key] || fallback
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = () => {
    return import.meta.env.DEV
}

/**
 * Check if running in production mode
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
    return import.meta.env.PROD
}
