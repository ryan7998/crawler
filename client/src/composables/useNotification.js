/**
 * Notification composable for managing toast notifications
 * Provides centralized notification logic that can be used by components
 */
import { ref, onUnmounted } from 'vue'

/**
 * Global notification state (singleton pattern)
 * This ensures all components share the same notification state
 */
const globalNotificationState = {
  showSnackbar: ref(false),
  snackbarText: ref(''),
  snackbarColor: ref('success'),
  timeout: null
}

/**
 * Notification composable
 * @param {Object} options - Configuration options
 * @param {number} options.duration - Auto-dismiss duration in ms (default: 3000)
 * @param {boolean} options.global - Use global state (default: true)
 * @returns {Object} Notification state and methods
 */
export function useNotification(options = {}) {
  const { duration = 3000, global = true } = options
  
  // Use global state or create local state
  const state = global ? globalNotificationState : {
    showSnackbar: ref(false),
    snackbarText: ref(''),
    snackbarColor: ref('success'),
    timeout: null
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   * @param {number} customDuration - Custom duration for this notification
   */
  const showNotification = (message, type = 'success', customDuration = duration) => {
    // Clear any existing timeout
    if (state.timeout) {
      clearTimeout(state.timeout)
    }
    
    // Update state
    state.showSnackbar.value = true
    state.snackbarText.value = message
    state.snackbarColor.value = type
    
    // Auto-dismiss after specified duration
    state.timeout = setTimeout(() => {
      state.showSnackbar.value = false
      state.timeout = null
    }, customDuration)
  }

  /**
   * Hide the current notification
   */
  const hideNotification = () => {
    if (state.timeout) {
      clearTimeout(state.timeout)
      state.timeout = null
    }
    state.showSnackbar.value = false
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   */
  const showSuccess = (message) => {
    showNotification(message, 'success')
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   */
  const showError = (message) => {
    showNotification(message, 'error')
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   */
  const showWarning = (message) => {
    showNotification(message, 'warning')
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   */
  const showInfo = (message) => {
    showNotification(message, 'info')
  }

  // Enhanced error handling methods
  /**
   * Handle error with context and logging
   * @param {Error|string} error - Error object or message
   * @param {string} context - Context where error occurred
   */
  const handleError = (error, context = '') => {
    console.error(`${context}:`, error)
    
    const errorMessage = typeof error === 'string' 
      ? error 
      : error.message || error.toString() || 'An unexpected error occurred'
    
    showNotification(errorMessage, 'error')
  }

  /**
   * Handle API errors specifically
   * @param {Error} error - API error
   * @param {string} operation - Operation being performed
   */
  const handleApiError = (error, operation = 'operation') => {
    const context = `API Error during ${operation}`
    handleError(error, context)
  }

  /**
   * Handle socket errors specifically
   * @param {Error} error - Socket error
   * @param {string} event - Socket event
   */
  const handleSocketError = (error, event = 'socket event') => {
    const context = `Socket Error during ${event}`
    handleError(error, context)
  }

  /**
   * Handle validation errors
   * @param {string} message - Validation message
   */
  const handleValidationError = (message) => {
    showWarning(`Validation Error: ${message}`)
  }

  /**
   * Handle network errors
   * @param {Error} error - Network error
   */
  const handleNetworkError = (error) => {
    handleError(error, 'Network Error')
  }

  /**
   * Handle timeout errors
   * @param {string} operation - Operation that timed out
   */
  const handleTimeoutError = (operation = 'operation') => {
    handleError('Request timed out. Please try again.', `Timeout during ${operation}`)
  }

  /**
   * Handle unauthorized errors
   */
  const handleUnauthorizedError = () => {
    handleError('You are not authorized to perform this action.', 'Authorization Error')
  }

  /**
   * Handle not found errors
   * @param {string} resource - Resource that wasn't found
   */
  const handleNotFoundError = (resource = 'resource') => {
    handleError('The requested resource was not found.', `${resource} not found`)
  }

  // Cleanup on unmount (only for local state)
  if (!global) {
    onUnmounted(() => {
      if (state.timeout) {
        clearTimeout(state.timeout)
      }
    })
  }

  return {
    // State
    showSnackbar: state.showSnackbar,
    snackbarText: state.snackbarText,
    snackbarColor: state.snackbarColor,
    
    // Basic notification methods
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Enhanced error handling methods
    handleError,
    handleApiError,
    handleSocketError,
    handleValidationError,
    handleNetworkError,
    handleTimeoutError,
    handleUnauthorizedError,
    handleNotFoundError
  }
}

/**
 * Global notification instance for backward compatibility
 * This maintains the current provide/inject pattern
 */
export const globalNotification = useNotification({ global: true })
