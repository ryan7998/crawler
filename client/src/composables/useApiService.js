import { ref } from 'vue'
import axios from 'axios'
import { getApiUrl } from '../utils/commonUtils'

/**
 * Reusable API service composable
 * Provides centralized API calls with error handling and loading states
 */
export function useApiService() {
  const loading = ref(false)
  const error = ref(null)

  // Create axios instance with default config
  const api = axios.create({
    baseURL: getApiUrl(),
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise} Response data
   */
  const get = async (url, config = {}) => {
    return await makeRequest(() => api.get(url, config))
  }

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Response data
   */
  const post = async (url, data = {}, config = {}) => {
    return await makeRequest(() => api.post(url, data, config))
  }

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Response data
   */
  const put = async (url, data = {}, config = {}) => {
    return await makeRequest(() => api.put(url, data, config))
  }

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise} Response data
   */
  const del = async (url, config = {}) => {
    return await makeRequest(() => api.delete(url, config))
  }

  /**
   * Make a PATCH request
   * @param {string} url - API endpoint
   * @param {any} data - Request data
   * @param {Object} config - Axios config
   * @returns {Promise} Response data
   */
  const patch = async (url, data = {}, config = {}) => {
    return await makeRequest(() => api.patch(url, data, config))
  }

  /**
   * Generic request wrapper with error handling and loading state
   * @param {Function} requestFn - Request function to execute
   * @returns {Promise} Response data
   */
  const makeRequest = async (requestFn) => {
    loading.value = true
    error.value = null

    try {
      const response = await requestFn()
      return response.data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
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