import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStatsBarStore = defineStore('statsBar', () => {
  // State
  const currentContext = ref('global') // 'global', 'crawl-details', 'proxy-stats', etc.
  const contextData = ref({})
  const customActions = ref([])
  
  // Getters
  const isGlobalContext = computed(() => currentContext.value === 'global')
  const isCrawlDetailsContext = computed(() => currentContext.value === 'crawl-details')
  
  // Actions
  const setContext = (context, data = {}, actions = []) => {
    currentContext.value = context
    contextData.value = data
    customActions.value = actions
  }
  
  const clearContext = () => {
    currentContext.value = 'global'
    contextData.value = {}
    customActions.value = []
  }
  
  return {
    // State
    currentContext,
    contextData,
    customActions,
    
    // Getters
    isGlobalContext,
    isCrawlDetailsContext,
    
    // Actions
    setContext,
    clearContext
  }
})
