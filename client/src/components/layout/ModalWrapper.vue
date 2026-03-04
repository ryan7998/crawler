<template>
  <!-- Auth Modal -->
  <AuthModal
    v-model="crawlStore.showAuthModal"
    :initial-mode="crawlStore.authModalMode"
    @auth-success="handleAuthSuccess"
  />

  <!-- Global Modals -->
  <CreateCrawlModal
    v-model="crawlStore.showCreateModal"
    :crawl-data="crawlStore.selectedCrawl"
    @crawl-created="handleCrawlCreated"
    @error="handleModalError"
  />

  <GlobalExportModal
    v-model="crawlStore.showGlobalExportModal"
    @export-success="handleGlobalExportSuccess"
  />

  <ExportModal
    v-model="crawlStore.showExportModal"
    :crawl-id="crawlStore.selectedCrawl?._id"
    :crawl-title="crawlStore.selectedCrawl?.title"
    @export-success="handleExportSuccess"
  />

  <QueueStatusModal
    v-model="crawlStore.showQueueStatusModal"
  />

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

  <ConfirmationModal
    v-model="crawlStore.showBulkDeleteConfirm"
    title="Delete Selected Crawls"
    message="Are you sure you want to delete the selected crawls? This action cannot be undone."
    :items="crawlStore.selectedCrawls"
    confirm-text="Delete All"
    cancel-text="Cancel"
    color="error"
    icon="mdi-delete"
    @confirm="confirmBulkDelete"
  />

  <!-- New confirmation modals for crawl actions -->
  <ConfirmationModal
    v-model="crawlStore.showDeleteCrawlConfirm"
    title="Confirm Deletion"
    message="Are you sure you want to delete this crawl? This action cannot be undone."
    confirm-text="Delete Crawl"
    cancel-text="Cancel"
    color="error"
    icon="mdi-delete"
    :loading="deleteLoading"
    @confirm="confirmDeleteCrawl"
  />

  <ConfirmationModal
    v-model="crawlStore.showClearDataConfirm"
    title="Clear Crawl Data"
    message="Are you sure you want to clear all crawled data for this crawl? The crawl configuration will remain intact, but all collected data will be deleted."
    confirm-text="Clear Data"
    cancel-text="Cancel"
    color="warning"
    icon="mdi-database-remove"
    :loading="clearDataLoading"
    @confirm="confirmClearData"
  />

  <ConfirmationModal
    v-model="crawlStore.showClearQueueConfirm"
    title="Clear Crawl Queue"
    message="Are you sure you want to clear the crawl queue? This will stop all pending crawl operations."
    confirm-text="Clear Queue"
    cancel-text="Cancel"
    color="warning"
    icon="mdi-queue-remove"
    :loading="clearQueueLoading"
    @confirm="confirmClearQueue"
  />

  <ConfirmationModal
    v-model="crawlStore.showRestartUrlsConfirm"
    title="Restart Selected URLs"
    message="Are you sure you want to restart the crawl for the selected URLs?"
    confirm-text="Restart Crawl"
    cancel-text="Cancel"
    color="info"
    icon="mdi-restart"
    :loading="restartLoading"
    @confirm="confirmRestartUrls"
  />
</template>

<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthModal from '../modals/AuthModal.vue'
import CreateCrawlModal from '../modals/CreateCrawlModal.vue'
import GlobalExportModal from '../modals/GlobalExportModal.vue'
import ExportModal from '../modals/ExportModal.vue'
import QueueStatusModal from '../modals/QueueStatusModal.vue'
import ConfirmationModal from '../modals/ui/ConfirmationModal.vue'
import { useCrawlStore } from '../../stores/crawlStore'
import { useCrawlManagement } from '../../composables/useCrawlManagement'
import { useCrawlActions } from '../../composables/useCrawlActions'
import { useApiService } from '../../composables/useApiService'

// Use crawl store for modal state
const crawlStore = useCrawlStore()

// Use crawl management for run all functionality
const { runAllCrawls, runAllLoading } = useCrawlManagement()

// Use crawl actions for other operations
const { 
  deleteLoading, 
  clearQueueLoading, 
  confirmDeleteCrawl: deleteCrawlAction,
  confirmClearCrawlQueue: clearQueueAction
} = useCrawlActions()

// Router for navigation
const router = useRouter()

// API service
const { post, del } = useApiService()

// Inject notification function
const showNotification = inject('showNotification')

// Loading states for new modals
const clearDataLoading = ref(false)
const restartLoading = ref(false)

// Auth modal handler
const handleAuthSuccess = () => {
  crawlStore.closeAuthModal()
  showNotification('Authentication successful!', 'success')
}

// Modal handlers
const handleCrawlCreated = (crawl) => {
  crawlStore.closeCreateModal()
  const exists = crawlStore.allCrawls.some(c => c._id === crawl._id)
  if (exists) {
    crawlStore.updateCrawl(crawl)
  } else {
    crawlStore.addCrawl(crawl)
  }
  crawlStore.triggerRefresh()
  showNotification('Crawl saved successfully', 'success')
}

const handleModalError = (errorMessage) => {
  showNotification(errorMessage, 'error')
}

const handleGlobalExportSuccess = (exportResult) => {
  showNotification('Global export completed successfully!', 'success')
}

const handleExportSuccess = (exportResult) => {
  crawlStore.closeExportModal()
  showNotification('Export completed successfully!', 'success')
}

const confirmRunAll = async () => {
  crawlStore.closeRunAllConfirm()
  await runAllCrawls()
}

const confirmBulkDelete = async () => {
  try {
    const deletedCount = crawlStore.selectedCrawls.length
    
    // Delete each selected crawl
    for (const crawlId of crawlStore.selectedCrawls) {
      await del(`/api/deletecrawl/${crawlId}`)
      crawlStore.removeCrawl(crawlId) // Remove from store
    }
    
    crawlStore.closeBulkDeleteConfirm()
    crawlStore.clearSelectedCrawls()
    showNotification(`Successfully deleted ${deletedCount} crawls`, 'success')
    
    // Trigger refresh using store
    crawlStore.triggerRefresh()
  } catch (error) {
    showNotification(error.message, 'error')
    crawlStore.closeBulkDeleteConfirm()
  }
}

// New confirmation handlers
const confirmDeleteCrawl = async () => {
  const crawlId = crawlStore.selectedCrawl?._id
  if (!crawlId) {
    showNotification('No crawl selected', 'error')
    return
  }
  
  await deleteCrawlAction(crawlId, true)
  crawlStore.closeDeleteCrawlConfirm()
}

const confirmClearData = async () => {
  try {
    clearDataLoading.value = true
    const crawlId = crawlStore.selectedCrawl?._id
    if (!crawlId) {
      showNotification('No crawl selected', 'error')
      return
    }
    
    const response = await del(`/api/deletecrawldata/${crawlId}`)
    crawlStore.closeClearDataConfirm()
    showNotification(`Crawl data cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
    
    // Trigger refresh
    crawlStore.triggerRefresh()
  } catch (error) {
    showNotification(error.message, 'error')
  } finally {
    clearDataLoading.value = false
  }
}

const confirmClearQueue = async () => {
  const crawlId = crawlStore.selectedCrawl?._id
  if (!crawlId) {
    showNotification('No crawl selected', 'error')
    return
  }

  await clearQueueAction(crawlId, () => {
    crawlStore.triggerRefresh()
  })
  crawlStore.closeClearQueueConfirm()
}

const confirmRestartUrls = async () => {
  try {
    restartLoading.value = true
    const crawlId = crawlStore.selectedCrawl?._id
    const selectedUrls = crawlStore.selectedUrls || []
    const selectors = crawlStore.selectedCrawl?.selectors || []
    
    if (!crawlId) {
      showNotification('No crawl selected', 'error')
      return
    }
    
    if (selectedUrls.length === 0) {
      showNotification('No URLs selected', 'error')
      return
    }
    
    const requestBody = {
      urls: selectedUrls,
      crawlId,
      selectors
    }
    
    await post('/api/startcrawl', requestBody)
    crawlStore.closeRestartUrlsConfirm()
    showNotification(`Restarted crawl for ${selectedUrls.length} selected URLs`, 'success')
    
    // Trigger refresh
    crawlStore.triggerRefresh()
  } catch (error) {
    showNotification(error.message, 'error')
  } finally {
    restartLoading.value = false
  }
}

// Expose auth modal handler for global access
window.openAuthModal = (mode) => {
  crawlStore.openAuthModal(mode)
}
</script>
