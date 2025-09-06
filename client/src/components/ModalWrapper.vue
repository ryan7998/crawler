<template>
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
</template>

<script setup>
import { inject } from 'vue'
import CreateCrawlModal from './CreateCrawlModal.vue'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'
import ConfirmationModal from './ui/ConfirmationModal.vue'
import { useCrawlStore } from '../stores/crawlStore'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useApiService } from '../composables/useApiService'

// Use crawl store for modal state
const crawlStore = useCrawlStore()

// Use crawl management for run all functionality
const { runAllCrawls, runAllLoading } = useCrawlManagement()

// Inject notification function
const showNotification = inject('showNotification')

// Modal handlers
const handleCrawlCreated = (crawl) => {
  crawlStore.closeCreateModal()
  crawlStore.addCrawl(crawl)
  showNotification('Crawl saved successfully', 'success')
}

const handleModalError = (errorMessage) => {
  showNotification(errorMessage, 'error')
}

const handleGlobalExportSuccess = (exportResult) => {
  showNotification('Global export completed successfully!', 'success')
}

const confirmRunAll = async () => {
  crawlStore.closeRunAllConfirm()
  await runAllCrawls()
}

const confirmBulkDelete = async () => {
  try {
    const { del } = useApiService()
    const deletedCount = crawlStore.selectedCrawls.length
    
    // Delete each selected crawl
    for (const crawlId of crawlStore.selectedCrawls) {
      await del(`/api/deletecrawl/${crawlId}`)
      crawlStore.removeCrawl(crawlId) // Remove from store
    }
    
    crawlStore.closeBulkDeleteConfirm()
    crawlStore.clearSelectedCrawls()
    showNotification(`Successfully deleted ${deletedCount} crawls`, 'success')
    
    // Emit event to refresh the crawls list
    window.dispatchEvent(new CustomEvent('refresh-crawls'))
  } catch (error) {
    showNotification(error.message, 'error')
    crawlStore.closeBulkDeleteConfirm()
  }
}
</script>
