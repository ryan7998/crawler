<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Crawls Table -->
      <CrawlerTable
        :has-selected="hasSelectedCrawls"
        @crawl-click="openCrawl"
        @view-crawl="openCrawl"
        @edit-crawl="editCrawl"
        @delete-crawl="confirmDeleteCrawl"
        @bulk-delete="handleBulkDelete"
        @bulk-export="handleBulkExport"
      />
    </div>
  </div>
</template>

<script setup>
import { 
  inject, 
  computed, 
  watchEffect,
  watch
} from 'vue'
import { useRouter } from 'vue-router'
import CrawlerTable from '../ui/data/CrawlerTable.vue'
import { useCrawlManagement } from '../../composables/useCrawlManagement'
import { useCrawlStore } from '../../stores/crawlStore'
import { useApiService } from '../../composables/useApiService'

const router = useRouter()

// Use the crawl store for modal state
const crawlStore = useCrawlStore()

// Initialize API service
const { del } = useApiService()

// Initialize crawl management composable for general dashboard
const {
  runAllLoading,
  runAllCrawls: runAllCrawlsFromComposable
} = useCrawlManagement()

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


</script>
