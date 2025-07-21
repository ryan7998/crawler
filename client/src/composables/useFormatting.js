import { computed } from 'vue'

/**
 * Centralized formatting utilities for the application
 * Consolidates all formatting functions to avoid duplication
 */
export function useFormatting() {
  /**
   * Format number with locale-specific formatting
   * @param {number} value - Number to format
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  const formatNumber = (value, options = {}) => {
    const safeValue = value || 0
    return new Intl.NumberFormat('en-US', options).format(safeValue)
  }

  /**
   * Format currency values
   * @param {number} cost - Cost value to format
   * @param {string} currency - Currency code (default: USD)
   * @param {number} minimumFractionDigits - Minimum decimal places
   * @returns {string} Formatted currency string
   */
  const formatCost = (cost, currency = 'USD', minimumFractionDigits = 4) => {
    return formatNumber(cost, {
      style: 'currency',
      currency,
      minimumFractionDigits
    })
  }

  /**
   * Format percentage values
   * @param {number} value - Percentage value (0-100)
   * @param {number} decimalPlaces - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  const formatPercentage = (value, decimalPlaces = 1) => {
    const safeValue = parseFloat(value) || 0
    return `${safeValue.toFixed(decimalPlaces)}%`
  }

  /**
   * Format date with full date and time
   * @param {Date|string} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date string
   */
  const formatDate = (date, options = {}) => {
    if (!date) return 'Never'
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
      .format(new Date(date))
  }

  /**
   * Format date with short format (date only)
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDateShort = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  /**
   * Get relative time from a date (e.g., "2 days ago", "3 hours ago")
   * @param {Date|string} date - Date to get relative time for
   * @returns {string} Relative time string
   */
  const getRelativeTime = (date) => {
    if (!date) return 'Never'
    
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((now - targetDate) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  }

  /**
   * Format response time in milliseconds
   * @param {number} time - Time in milliseconds
   * @returns {string} Formatted time string
   */
  const formatResponseTime = (time) => {
    if (!time) return 'N/A'
    return `${time.toFixed(0)}ms`
  }

  /**
   * Format file size in bytes to human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add when truncated
   * @returns {string} Truncated text
   */
  const truncateText = (text, maxLength = 50, suffix = '...') => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + suffix
  }

  /**
   * Format URL for display (truncate long URLs)
   * @param {string} url - URL to format
   * @param {number} maxLength - Maximum length
   * @returns {string} Formatted URL
   */
  const formatUrl = (url, maxLength = 50) => {
    if (!url) return 'N/A'
    if (url.length <= maxLength) return url
    
    const protocol = url.match(/^https?:\/\//)?.[0] || ''
    const domain = url.replace(/^https?:\/\//, '').split('/')[0]
    const path = url.replace(/^https?:\/\/[^\/]+/, '')
    
    if (protocol + domain.length <= maxLength) {
      return protocol + domain + (path ? '...' : '')
    }
    
    return truncateText(url, maxLength)
  }

  /**
   * Get color for success rate display
   * @param {number} rate - Success rate (0-100)
   * @returns {string} Color name for Vuetify
   */
  const getSuccessRateColor = (rate) => {
    const safeRate = parseFloat(rate) || 0
    if (safeRate >= 90) return 'success'
    if (safeRate >= 70) return 'warning'
    return 'error'
  }

  /**
   * Format status for display
   * @param {string} status - Status string
   * @returns {string} Formatted status
   */
  const formatStatus = (status) => {
    if (!status) return 'Unknown'
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return {
    // Number formatting
    formatNumber,
    formatCost,
    formatPercentage,
    
    // Date/time formatting
    formatDate,
    formatDateShort,
    getRelativeTime,
    formatResponseTime,
    
    // Text formatting
    formatFileSize,
    truncateText,
    formatUrl,
    formatStatus,
    
    // Utility functions
    getSuccessRateColor
  }
} 