import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStatsBarStore } from '../stores/statsBarStore'

export function useStatsBarContext() {
  const route = useRoute()
  const statsBarStore = useStatsBarStore()

  // Set context based on current route
  const setContextFromRoute = () => {
    const routeName = route.name
    const routeParams = route.params

    switch (routeName) {
      case 'CrawlDetails':
        // Set loading context immediately for crawl-details
        statsBarStore.setContext('crawl-details', {
          title: 'Loading...',
          status: 'Loading...',
          totalUrls: 0,
          completedUrls: 0,
          failedUrls: 0,
          hasData: false
        })
        break
      case 'proxy-stats':
        statsBarStore.setContext('proxy-stats', {
          type: 'proxy',
          title: 'Proxy Statistics'
        })
        break
      default:
        statsBarStore.setContext('global')
    }
  }

  // Set context immediately and watch for route changes
  setContextFromRoute()
  
  // Watch for route changes
  watch(() => route.name, () => {
    setContextFromRoute()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    statsBarStore.clearContext()
  })

  return {
    setContext: statsBarStore.setContext,
    clearContext: statsBarStore.clearContext,
    currentContext: statsBarStore.currentContext,
    contextData: statsBarStore.contextData
  }
}
