import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Reactive state
  const isInitialized = ref(false)

  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)
  const isSuperAdmin = computed(() => authStore.isSuperAdmin)
  const isAdmin = computed(() => authStore.isAdmin)
  const userFullName = computed(() => authStore.userFullName)

  // Auth methods
  const login = async (credentials) => {
    const result = await authStore.login(credentials)
    if (result.success) {
      // Redirect to dashboard or intended page
      const redirectTo = router.currentRoute.value.query.redirect || '/'
      router.push(redirectTo)
    }
    return result
  }

  const register = async (userData) => {
    const result = await authStore.register(userData)
    if (result.success) {
      // Redirect to dashboard after successful registration
      router.push('/')
    }
    return result
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/')
  }

  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  const requireSuperAdmin = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
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
      router.push('/login')
      return false
    }
    if (!isAdmin.value) {
      router.push('/')
      return false
    }
    return true
  }

  // Initialize authentication on app start
  const initializeAuth = async () => {
    if (!isInitialized.value) {
      await authStore.initializeAuth()
      isInitialized.value = true
    }
  }

  // Clear error
  const clearError = () => {
    authStore.error = null
  }

  return {
    // State
    isAuthenticated,
    user,
    loading,
    error,
    isSuperAdmin,
    isAdmin,
    userFullName,
    isInitialized,

    // Methods
    login,
    register,
    logout,
    requireAuth,
    requireSuperAdmin,
    requireAdmin,
    initializeAuth,
    clearError,

    // Direct store access for advanced usage
    authStore
  }
}
