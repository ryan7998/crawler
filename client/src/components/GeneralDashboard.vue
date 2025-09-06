<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <CrawlerListHeader
      :selected-count="selectedCrawls.length"
      @bulk-delete="handleBulkDelete"
      @bulk-export="handleBulkExport"
    />

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
      />
    </div>

    <!-- Create Crawl Modal -->
    <CreateCrawlModal
      v-model="crawlStore.showCreateModal"
      :crawl-data="crawlStore.selectedCrawl"
      @crawl-created="handleCrawlCreated"
      @error="handleModalError"
    />

    <!-- Global Export Modal -->
    <GlobalExportModal
      v-model="crawlStore.showGlobalExportModal"
      @export-success="handleGlobalExportSuccess"
    />

    <!-- Queue Status Modal -->
    <QueueStatusModal
      v-model="crawlStore.showQueueStatusModal"
    />

    <!-- Run All Confirmation Modal -->
    <ConfirmationModal
      v-model="crawlStore.showRunAllConfirm"
      title="Confirm Run All"
      message="Are you sure you want to run all crawls? This will start all enabled crawls that are not already in progress."
      confirm-text="Run All"
      cancel-text="Cancel"
      color="info"
      :loading="runAllLoading"
      @confirm="confirmRunAll"
    />

    <!-- Bulk Delete Confirmation Modal -->
    <ConfirmationModal
      v-model="showBulkDeleteConfirm"
      title="Delete Selected Crawls"
      message="Are you sure you want to delete the selected crawls? This action cannot be undone."
      :items="selectedCrawls"
      confirm-text="Delete All"
      cancel-text="Cancel"
      color="error"
      icon="mdi-delete"
      @confirm="bulkDeleteCrawls"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import CrawlerListHeader from './ui/CrawlerListHeader.vue'
import CrawlerTable from './ui/CrawlerTable.vue'
import CreateCrawlModal from './CreateCrawlModal.vue'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'
import ConfirmationModal from './ui/ConfirmationModal.vue'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useCrawlStore } from '../stores/crawlStore'
import { useApiService } from '../composables/useApiService'

const router = useRouter()

// General dashboard state
const selectedCrawls = ref([])
const showBulkDeleteConfirm = ref(false)

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

const handleCrawlCreated = (crawl) => {
  crawlStore.closeCreateModal()
  crawlStore.addCrawl(crawl) // Add to store
  showNotification('Crawl saved successfully', 'success')
  // Refresh the crawls list
  fetchCrawls({ page: 1, itemsPerPage: 50 })
}

const handleModalError = (errorMessage) => {
  showNotification(errorMessage, 'error')
}

// Modal handlers
const handleGlobalExportSuccess = (exportResult) => {
  showNotification('Global export completed successfully!', 'success')
}

const confirmRunAll = async () => {
  crawlStore.closeRunAllConfirm()
  await runAllCrawlsFromComposable()
}

// Bulk operations for general dashboard
const handleBulkDelete = () => {
  if (selectedCrawls.value.length === 0) return
  showBulkDeleteConfirm.value = true
}

const handleBulkExport = () => {
  if (selectedCrawls.value.length === 0) return
  // TODO: Implement bulk export functionality
  showNotification('Bulk export functionality coming soon!', 'info')
}

const confirmDeleteCrawl = (crawlId) => {
  selectedCrawls.value = [crawlId]
  showBulkDeleteConfirm.value = true
}

const bulkDeleteCrawls = async () => {
  try {
    const deletedCount = selectedCrawls.value.length
    
    // Delete each selected crawl
    for (const crawlId of selectedCrawls.value) {
      await del(`/api/deletecrawl/${crawlId}`)
      crawlStore.removeCrawl(crawlId) // Remove from store
    }
    
    showBulkDeleteConfirm.value = false
    selectedCrawls.value = []
    showNotification(`Successfully deleted ${deletedCount} crawls`, 'success')
    
    // Refresh the crawls list
    await fetchCrawls({ page: 1, itemsPerPage: 50 })
  } catch (error) {
    showNotification(error.message, 'error')
    showBulkDeleteConfirm.value = false
  }
}
</script>
