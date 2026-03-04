import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiService } from '../composables/useApiService'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin')
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'superadmin')
  const userFullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  // API service
  const { post, put, get } = useApiService()

  // Actions
  const setAuthData = (userData, authToken) => {
    user.value = userData
    token.value = authToken
    localStorage.setItem('auth_token', authToken)
  }

  const clearAuthData = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  // Handle auth expiration (called by API service)
  const handleAuthExpired = () => {
    clearAuthData()
    // The router guard will automatically handle navigation
    // when isAuthenticated becomes false
  }

  const login = async (credentials) => {
    try {
      loading.value = true
      error.value = null

      const response = await post('/api/auth/login', credentials)
      
      if (response.success) {
        setAuthData(response.data.user, response.data.token)
        return { success: true, message: 'Login successful' }
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    try {
      loading.value = true
      error.value = null

      const response = await post('/api/auth/register', userData)
      
      if (response.success) {
        setAuthData(response.data.user, response.data.token)
        return { success: true, message: 'Registration successful' }
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true
      
      // Call logout endpoint
      await post('/api/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuthData()
      loading.value = false
    }
  }

  const verifyToken = async () => {
    if (!token.value) return false

    try {
      const response = await get('/api/auth/verify')
      
      if (response.success) {
        user.value = response.data
        return true
      } else {
        clearAuthData()
        return false
      }
    } catch (err) {
      console.error('Token verification failed:', err)
      clearAuthData()
      return false
    }
  }

  const getProfile = async () => {
    try {
      const response = await get('/api/auth/profile')
      
      if (response.success) {
        user.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to get profile')
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  const updateProfile = async (profileData) => {
    try {
      loading.value = true
      error.value = null

      const response = await put('/api/auth/profile', profileData)
      
      if (response.success) {
        user.value = response.data
        return { success: true, message: 'Profile updated successfully' }
      } else {
        throw new Error(response.error || 'Profile update failed')
      }
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (passwordData) => {
    try {
      loading.value = true
      error.value = null

      const response = await put('/api/auth/change-password', passwordData)
      
      if (response.success) {
        return { success: true, message: 'Password changed successfully' }
      } else {
        throw new Error(response.error || 'Password change failed')
      }
    } catch (err) {
      error.value = err.message
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // Initialize auth state on app start
  const initializeAuth = async () => {
    if (token.value) {
      await verifyToken()
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    userFullName,
    
    // Actions
    login,
    register,
    logout,
    verifyToken,
    getProfile,
    updateProfile,
    changePassword,
    initializeAuth,
    clearAuthData,
    handleAuthExpired
  }
})
