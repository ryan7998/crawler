import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

/**
 * Authentication composable with navigation integration
 * Provides UI-level auth functionality and route guards
 * For business logic, use useAuthStore() directly
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Local state for UI concerns only
  const isInitialized = ref(false)

  // Computed properties (convenience wrappers)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const isAdmin = computed(() => authStore.isAdmin)
  const userFullName = computed(() => authStore.userFullName)

  // Helper function to check authentication before operations
  const withAuth = (callback, fallback = () => {}) => {
    if (!isAuthenticated.value) {
      fallback()
      return false
    }
    return callback()
  }

  // Navigation-integrated auth methods
  const login = async (credentials) => {
    const result = await authStore.login(credentials)
    if (result.success) {
      const redirectTo = router.currentRoute.value.query.redirect || '/'
      router.push(redirectTo)
    }
    return result
  }

  const register = async (userData) => {
    const result = await authStore.register(userData)
    if (result.success) {
      router.push('/')
    }
    return result
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/')
  }

  // Route guard helpers
  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/')
      return false
    }
    return true
  }

  const requireSuperAdmin = () => {
    if (!isAuthenticated.value) {
      router.push('/')
      return false
    }
    if (!isSuperAdmin.value) {
      router.push('/')
      return false
    }
    return true
  }

  const requireAdmin = () => {
    if (!isAuthenticated.value) {
      router.push('/')
      return false
    }
    if (!isAdmin.value) {
      router.push('/')
      return false
    }
    return true
  }

  // UI initialization
  const initializeAuth = async () => {
    if (!isInitialized.value) {
      await authStore.initializeAuth()
      isInitialized.value = true
    }
  }

  const clearError = () => {
    authStore.error = null
  }

  return {
    // Computed state (convenience wrappers)
    isAuthenticated,
    user,
    loading,
    error,
    isSuperAdmin,
    isAdmin,
    userFullName,
    isInitialized,

    // Navigation-integrated methods
    login,
    register,
    logout,
    
    // Route guards
    requireAuth,
    requireSuperAdmin,
    requireAdmin,
    
    // Helper for composables
    withAuth,
    
    // UI helpers
    initializeAuth,
    clearError,

    // Direct store access for business logic
    authStore
  }
}
