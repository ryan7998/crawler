<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Crawls Table -->
      <CrawlerTable
        :crawls="allCrawls"
        :loading="crawlsLoading"
        :has-selected="hasSelectedCrawls"
        @crawl-click="openCrawl"
        @view-crawl="openCrawl"
        @edit-crawl="editCrawl"
        @delete-crawl="confirmDeleteCrawl"
        @retry="handleRetry"
        @bulk-delete="handleBulkDelete"
        @bulk-export="handleBulkExport"
      />
    </div>
  </div>
</template>

<script setup>
import { 
  onMounted, 
  onUnmounted, 
  inject, 
  computed, 
  ref, 
  shallowRef,
  watchEffect,
  watch
} from 'vue'
import { useRouter } from 'vue-router'
import CrawlerTable from './ui/CrawlerTable.vue'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useCrawlStore } from '../stores/crawlStore'
import { useApiService } from '../composables/useApiService'

const router = useRouter()

// Use the crawl store for modal state
const crawlStore = useCrawlStore()

// Initialize API service
const { del } = useApiService()

// Initialize crawl management composable for general dashboard
const {
  isSearching: crawlsLoading,
  fetchCrawls,
  runAllLoading,
  runAllCrawls: runAllCrawlsFromComposable
} = useCrawlManagement()

// Use store for crawl data - memoized computed
const allCrawls = computed(() => crawlStore.allCrawls)

// Memoized pagination options to prevent recreation
const paginationOptions = shallowRef({ page: 1, itemsPerPage: 50 })

// Memoized event handler to prevent recreation
const handleRefreshCrawls = () => {
  fetchCrawls(paginationOptions.value)
}

// Inject the notification function
const showNotification = inject('showNotification')

// Memoized methods using computed for better performance
const openCrawl = (crawlId) => {
  router.push({ name: 'CrawlDetails', params: { crawlId } })
}

const editCrawl = (crawl) => {
  crawlStore.openCreateModal(crawl)
}

// Memoized bulk operations
const handleBulkDelete = () => {
  if (crawlStore.selectedCrawls.length === 0) return
  crawlStore.openBulkDeleteConfirm()
}

const handleBulkExport = () => {
  if (crawlStore.selectedCrawls.length === 0) return
  // TODO: Implement bulk export functionality
  showNotification('Bulk export functionality coming soon!', 'info')
}

const confirmDeleteCrawl = (crawlId) => {
  crawlStore.setSelectedCrawls([crawlId])
  crawlStore.openBulkDeleteConfirm()
}

// Memoized retry handler
const handleRetry = () => {
  fetchCrawls(paginationOptions.value)
}

// Watch for changes in selected crawls to optimize bulk operations
const hasSelectedCrawls = computed(() => crawlStore.selectedCrawls.length > 0)

// Watch for changes in crawl data to optimize re-renders
watch(
  () => crawlStore.allCrawls,
  (newCrawls) => {
    console.log('GeneralDashboard: Crawls updated, count:', newCrawls.length)
  },
  { deep: false } // Shallow watch for better performance
)

// Use watchEffect for side effects that depend on reactive state
watchEffect(() => {
  // This will run whenever any of its dependencies change
  if (crawlStore.allCrawls.length > 0) {
    console.log('GeneralDashboard: Crawls loaded successfully')
  }
})

// Fetch crawls when component mounts
onMounted(() => {
  console.log('GeneralDashboard: Mounted, fetching crawls...')
  fetchCrawls(paginationOptions.value)
  
  // Listen for refresh events from global modals
  window.addEventListener('refresh-crawls', handleRefreshCrawls)
})

// Cleanup event listener on unmount
onUnmounted(() => {
  window.removeEventListener('refresh-crawls', handleRefreshCrawls)
})

</script>
