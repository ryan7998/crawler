import { ref, computed } from 'vue'
import axios from 'axios'
import { getApiUrl } from '@/utils/commonUtils'
import { useFormatting } from './useFormatting'

export function useProxyStats() {
  const proxyStats = ref(null)
  const globalStats = ref(null)
  const costAnalysis = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Use centralized formatting utilities
  const {
    formatNumber,
    formatCost,
    formatPercentage,
    formatDate,
    getRelativeTime,
    getSuccessRateColor
  } = useFormatting()

  // Get proxy stats for a specific crawl
  const fetchCrawlProxyStats = async (crawlId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${getApiUrl()}/api/crawls/${crawlId}/proxy-stats`)
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Proxy stats endpoint not available - server may not be running or endpoint not configured')
      }
      
      proxyStats.value = response.data
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Proxy stats endpoint not found - ensure server is running with proxy tracking enabled'
      } else if (err.message.includes('Proxy stats endpoint not available')) {
        error.value = err.message
      } else {
        error.value = err.response?.data?.message || 'Failed to fetch proxy stats'
      }
      console.error('Error fetching crawl proxy stats:', err)
      
      // Set default values when API is not available
      proxyStats.value = {
        summary: {
          totalProxyRequests: 0,
          uniqueProxiesUsed: 0,
          totalCost: 0,
          averageProxySuccessRate: 0,
          lastProxyUsed: null
        },
        detailedUsage: [],
        proxyPerformance: []
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get global proxy stats
  const fetchGlobalProxyStats = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${getApiUrl()}/api/proxy-stats/global`)
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Global proxy stats endpoint not available - server may not be running or endpoint not configured')
      }
      
      globalStats.value = response.data
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Global proxy stats endpoint not found - ensure server is running with proxy tracking enabled'
      } else if (err.message.includes('Global proxy stats endpoint not available')) {
        error.value = err.message
      } else {
        error.value = err.response?.data?.message || 'Failed to fetch global proxy stats'
      }
      console.error('Error fetching global proxy stats:', err)
      
      // Set default values when API is not available
      globalStats.value = {
        summary: {
          totalProxyRequests: 0,
          uniqueProxiesUsed: 0,
          totalCost: 0,
          averageSuccessRate: 0
        },
        topProxies: [],
        recentUsage: []
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get cost analysis
  const fetchCostAnalysis = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = new URLSearchParams()
      if (params.crawlId) queryParams.append('crawlId', params.crawlId)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      
      const response = await axios.get(`${getApiUrl()}/api/proxy-stats/cost-analysis?${queryParams}`)
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Cost analysis endpoint not available - server may not be running or endpoint not configured')
      }
      
      costAnalysis.value = response.data
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Cost analysis endpoint not found - ensure server is running with proxy tracking enabled'
      } else if (err.message.includes('Cost analysis endpoint not available')) {
        error.value = err.message
      } else {
        error.value = err.response?.data?.message || 'Failed to fetch cost analysis'
      }
      console.error('Error fetching cost analysis:', err)
      
      // Set default values when API is not available
      costAnalysis.value = {
        totalCost: 0,
        totalRequests: 0,
        dailyCosts: []
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get proxy usage for a specific URL
  const fetchProxyUsageForUrl = async (url) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${getApiUrl()}/api/proxy-stats/url-usage?url=${encodeURIComponent(url)}`)
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('URL usage endpoint not available - server may not be running or endpoint not configured')
      }
      
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'URL usage endpoint not found - ensure server is running with proxy tracking enabled'
      } else if (err.message.includes('URL usage endpoint not available')) {
        error.value = err.message
      } else {
        error.value = err.response?.data?.message || 'Failed to fetch URL usage'
      }
      console.error('Error fetching URL usage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cleanup old proxy usage records
  const cleanupProxyUsage = async (daysOld = 90) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.delete(`${getApiUrl()}/api/proxy-stats/cleanup?daysOld=${daysOld}`)
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Cleanup endpoint not available - server may not be running or endpoint not configured')
      }
      
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = 'Cleanup endpoint not found - ensure server is running with proxy tracking enabled'
      } else if (err.message.includes('Cleanup endpoint not available')) {
        error.value = err.message
      } else {
        error.value = err.response?.data?.message || 'Failed to cleanup proxy usage'
      }
      console.error('Error cleaning up proxy usage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties for formatted data
  const formattedCrawlStats = computed(() => {
    if (!proxyStats.value || !proxyStats.value.summary) return {
      totalRequests: 0,
      uniqueProxies: 0,
      totalCost: 0,
      successRate: 0,
      lastUsed: null
    }
    
    const { summary } = proxyStats.value
    return {
      totalRequests: summary.totalProxyRequests || 0,
      uniqueProxies: summary.uniqueProxiesUsed || 0,
      totalCost: summary.totalCost || 0,
      successRate: summary.averageProxySuccessRate || 0,
      lastUsed: summary.lastProxyUsed ? new Date(summary.lastProxyUsed) : null
    }
  })

  const formattedGlobalStats = computed(() => {
    if (!globalStats.value || !globalStats.value.summary) return {
      totalRequests: 0,
      uniqueProxies: 0,
      totalCost: 0,
      successRate: 0
    }
    
    const { summary } = globalStats.value
    return {
      totalRequests: summary.totalProxyRequests || 0,
      uniqueProxies: summary.uniqueProxiesUsed || 0,
      totalCost: summary.totalCost || 0,
      successRate: summary.averageSuccessRate || 0
    }
  })

  const formattedCostAnalysis = computed(() => {
    if (!costAnalysis.value) return {
      totalCost: 0,
      totalRequests: 0,
      dailyCosts: []
    }
    
    return {
      totalCost: costAnalysis.value.totalCost || 0,
      totalRequests: costAnalysis.value.totalRequests || 0,
      dailyCosts: costAnalysis.value.dailyCosts || []
    }
  })

  return {
    // State
    proxyStats,
    globalStats,
    costAnalysis,
    loading,
    error,
    
    // Methods
    fetchCrawlProxyStats,
    fetchGlobalProxyStats,
    fetchCostAnalysis,
    fetchProxyUsageForUrl,
    cleanupProxyUsage,
    
    // Computed
    formattedCrawlStats,
    formattedGlobalStats,
    formattedCostAnalysis,
    
    // Formatting utilities (from useFormatting)
    formatNumber,
    formatCost,
    formatPercentage,
    formatDate,
    getRelativeTime,
    getSuccessRateColor
  }
} 