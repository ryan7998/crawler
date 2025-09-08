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
    
    // Methods
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

/**
 * Global notification instance for backward compatibility
 * This maintains the current provide/inject pattern
 */
export const globalNotification = useNotification({ global: true })
