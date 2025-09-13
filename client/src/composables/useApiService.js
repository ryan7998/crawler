import { ref } from 'vue'
import axios from 'axios'
import { getApiUrl } from '../utils/environmentUtils'
import { useAuthStore } from '../stores/authStore'
import { useNotification } from './useNotification'

/**
 * Reusable API service composable
 * Provides centralized API calls with error handling and loading states
 */
export function useApiService() {
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()
  const { handleApiError, handleNetworkError } = useNotification()

  // Create axios instance with default config
  const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, handle through auth store
        authStore.handleAuthExpired()
      }
      return Promise.reject(error)
    }
  )

  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {Object} config - Axios config
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  const get = async (url, config = {}, options = {}) => {
    return await makeRequest(() => api.get(url, config), { context: `GET ${url}`, ...options })
  }

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  const post = async (url, data = {}, config = {}, options = {}) => {
    return await makeRequest(() => api.post(url, data, config), { context: `POST ${url}`, ...options })
  }

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  const put = async (url, data = {}, config = {}, options = {}) => {
    return await makeRequest(() => api.put(url, data, config), { context: `PUT ${url}`, ...options })
  }

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {Object} config - Axios config
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  const del = async (url, config = {}, options = {}) => {
    return await makeRequest(() => api.delete(url, config), { context: `DELETE ${url}`, ...options })
  }

  /**
   * Make a PATCH request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @param {Object} options - Request options
   * @returns {Promise} Response data
   */
  const patch = async (url, data = {}, config = {}, options = {}) => {
    return await makeRequest(() => api.patch(url, data, config), { context: `PATCH ${url}`, ...options })
  }

  /**
   * Generic request wrapper with error handling and loading state
   * @param {Function} requestFn - Request function to execute
   * @param {Object} options - Request options
   * @param {boolean} options.silent - Whether to suppress error notifications
   * @param {string} options.context - Context for error messages
   * @returns {Promise} Response data
   */
  const makeRequest = async (requestFn, options = {}) => {
    const { silent = false, context = 'API request' } = options
    
    loading.value = true
    error.value = null

    try {
      const response = await requestFn()
      return response.data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      
      // Use centralized error handling (unless silent)
      if (!silent) {
        if (err.response) {
          handleApiError(err, context)
        } else if (err.request) {
          handleNetworkError(err)
        } else {
          handleApiError(err, context)
        }
      }
      
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  /**
   * Extract error message from axios error
   * @param {Error} err - Axios error
   * @returns {string} Error message
   */
  const getErrorMessage = (err) => {
    if (err.response) {
      // Server responded with error status
      const { data, status } = err.response
      if (data?.message) return data.message
      if (data?.error) return data.error
      return `Server error (${status})`
    } else if (err.request) {
      // Request was made but no response received
      return 'Network error - no response from server'
    } else {
      // Something else happened
      return err.message || 'An unexpected error occurred'
    }
  }

  /**
   * Clear current error
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Set custom error
   * @param {string} message - Error message
   */
  const setError = (message) => {
    error.value = message
  }

  return {
    // State
    loading,
    error,
    
    // Methods
    get,
    post,
    put,
    del,
    patch,
    clearError,
    setError
  }
} 