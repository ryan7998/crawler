import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStatsBarStore = defineStore('statsBar', () => {
  // State
  const currentContext = ref('global') // 'global', 'crawl-details', 'proxy-stats', etc.
  const contextData = ref({})
  const customActions = ref([])
  const proxyStats = ref(null)
  const proxyStatsLoading = ref(false)
  const showProxyModal = ref(false)
  
  // Getters
  const isGlobalContext = computed(() => currentContext.value === 'global')
  const isCrawlDetailsContext = computed(() => currentContext.value === 'crawl-details')
  
  // Actions
  const setContext = (context, data = {}, actions = []) => {
    currentContext.value = context
    contextData.value = data
    customActions.value = actions
  }
  
  const setProxyStats = (stats) => {
    proxyStats.value = stats
  }
  
  const setProxyStatsLoading = (loading) => {
    proxyStatsLoading.value = loading
  }

  const openProxyModal = () => {
    showProxyModal.value = true
  }

  const closeProxyModal = () => {
    showProxyModal.value = false
  }
  
  
  const clearContext = () => {
    currentContext.value = 'global'
    contextData.value = {}
    customActions.value = []
    proxyStats.value = null
    proxyStatsLoading.value = false
    showProxyModal.value = false
  }
  
  return {
    // State
    currentContext,
    contextData,
    customActions,
    proxyStats,
    proxyStatsLoading,
    showProxyModal,
    
    // Getters
    isGlobalContext,
    isCrawlDetailsContext,
    
    // Actions
    setContext,
    setProxyStats,
    setProxyStatsLoading,
    openProxyModal,
    closeProxyModal,
    clearContext
  }
})
