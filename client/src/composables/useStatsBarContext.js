import { onMounted, onUnmounted } from 'vue'
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
      case 'crawl-details':
        // This would be set by the CrawlDetailsView component
        // with specific crawl data
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

  // Watch for route changes
  onMounted(() => {
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
