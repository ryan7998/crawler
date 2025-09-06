<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Crawls Table -->
      <CrawlerTable
        :crawls="allCrawls"
        :loading="crawlsLoading"
        @crawl-click="openCrawl"
        @view-crawl="openCrawl"
        @edit-crawl="editCrawl"
        @delete-crawl="confirmDeleteCrawl"
        @retry="fetchCrawls({ page: 1, itemsPerPage: 50 })"
        @bulk-delete="handleBulkDelete"
        @bulk-export="handleBulkExport"
      />
    </div>

    <!-- Fixed Bottom Stats Bar -->
    <StatsBottomBar
      @refresh="handleRefresh"
      @export-all="handleGlobalExport"
    />


  </div>
</template>

<script setup>
import { onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import CrawlerTable from './ui/CrawlerTable.vue'
import StatsBottomBar from './ui/StatsBottomBar.vue'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useCrawlStore } from '../stores/crawlStore'
import { useApiService } from '../composables/useApiService'

const router = useRouter()

// General dashboard state

// Use the crawl store for modal state
const crawlStore = useCrawlStore()

// Initialize API service
const { del } = useApiService()

// Initialize crawl management composable for general dashboard
const {
  crawls: allCrawls,
  isSearching: crawlsLoading,
  fetchCrawls,
  runAllLoading,
  runAllCrawls: runAllCrawlsFromComposable
} = useCrawlManagement()

// Fetch crawls when component mounts
onMounted(() => {
  console.log('GeneralDashboard: Mounted, fetching crawls...')
  fetchCrawls({ page: 1, itemsPerPage: 50 })
  
  // Listen for refresh events from global modals
  window.addEventListener('refresh-crawls', () => {
    fetchCrawls({ page: 1, itemsPerPage: 50 })
  })
})

// Cleanup event listener on unmount
onUnmounted(() => {
  window.removeEventListener('refresh-crawls', () => {
    fetchCrawls({ page: 1, itemsPerPage: 50 })
  })
})

// Inject the notification function
const showNotification = inject('showNotification')

// General dashboard methods
const openCrawl = (crawlId) => {
  router.push({ name: 'CrawlDetails', params: { crawlId } })
}

const editCrawl = (crawl) => {
  crawlStore.openCreateModal(crawl)
}


// Bulk operations for general dashboard
const handleBulkDelete = () => {
  if (crawlStore.selectedCrawls.length === 0) return
  crawlStore.openBulkDeleteConfirm()
}

const handleBulkExport = () => {
  if (crawlStore.selectedCrawls.length === 0) return
  // TODO: Implement bulk export functionality
  showNotification('Bulk export functionality coming soon!', 'info')
}

// Bottom bar actions
const handleRefresh = () => {
  fetchCrawls({ page: 1, itemsPerPage: 50 })
}

const handleGlobalExport = () => {
  crawlStore.openGlobalExportModal()
}

const confirmDeleteCrawl = (crawlId) => {
  crawlStore.setSelectedCrawls([crawlId])
  crawlStore.openBulkDeleteConfirm()
}

</script>
