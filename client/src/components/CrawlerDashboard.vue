<template>
    <!-- General Dashboard (when no crawlId) -->
    <div v-if="isGeneralDashboard" :key="`general-${crawlId}`" class="min-h-screen bg-gray-50">
        <!-- Header -->
        <CrawlerListHeader
            :selected-count="selectedCrawls.length"
            @bulk-delete="handleBulkDelete"
            @bulk-export="handleBulkExport"
        />

    <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Statistics -->
            <CrawlerStats :stats="crawlStats" :loading="crawlsLoading" />

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

    <!-- Specific Crawl Dashboard (when crawlId exists) -->
    <CrawlDetailsView v-else :key="`crawl-${crawlId}`" :crawl-id="crawlId" />
</template>

<script setup>
import { onMounted, ref, inject, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CrawlerListHeader from './ui/CrawlerListHeader.vue'
import CrawlerTable from './ui/CrawlerTable.vue'
import CrawlerStats from './ui/CrawlerStats.vue'
import CrawlDetailsView from './CrawlDetailsView.vue'
import CreateCrawlModal from './CreateCrawlModal.vue'
import ConfirmationModal from './ui/ConfirmationModal.vue'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useCrawlStore } from '../stores/crawlStore'
import { formatDateTime } from '../utils/commonUtils'

const route = useRoute()
const router = useRouter()
const crawlId = ref(route.params.crawlId)
const isGeneralDashboard = computed(() => !crawlId.value)

// General dashboard state
const selectedCrawls = ref([])
const showBulkDeleteConfirm = ref(false)

// Use the crawl store for modal state
const crawlStore = useCrawlStore()

// Initialize crawl management composable for general dashboard
const {
  crawls: allCrawls,
  isSearching: crawlsLoading,
  fetchCrawls
} = useCrawlManagement()

// Fetch crawls when component mounts (only for general dashboard)
onMounted(() => {
  if (isGeneralDashboard.value) {
    console.log('CrawlerDashboard: General dashboard mounted, fetching crawls...')
    fetchCrawls({ page: 1, itemsPerPage: 50 })
  }
})

// Watch for route changes to handle component re-rendering
watch(() => route.params.crawlId, (newCrawlId, oldCrawlId) => {
  console.log('CrawlerDashboard: Route changed from', oldCrawlId, 'to', newCrawlId)
  
  // Update the local crawlId ref to trigger re-rendering
  crawlId.value = newCrawlId
  
  // If we're moving from a specific crawl to general dashboard, refetch crawls
  if (oldCrawlId && !newCrawlId) {
    console.log('CrawlerDashboard: Returning to general dashboard, refetching crawls...')
    fetchCrawls({ page: 1, itemsPerPage: 50 })
  }
}, { immediate: true })

// Also watch the computed isGeneralDashboard to ensure proper re-rendering
watch(isGeneralDashboard, (newValue, oldValue) => {
  console.log('CrawlerDashboard: isGeneralDashboard changed from', oldValue, 'to', newValue)
  
  // If we're now on the general dashboard, fetch crawls
  if (newValue && !oldValue) {
    console.log('CrawlerDashboard: Now on general dashboard, fetching crawls...')
    fetchCrawls({ page: 1, itemsPerPage: 50 })
  }
})

// Computed properties for general dashboard
const crawlStats = computed(() => {
  const crawls = allCrawls.value || []
  return {
    totalCrawls: crawls.length,
    activeCrawls: crawls.filter(c => c.status === 'in-progress' || c.status === 'pending').length,
    completedCrawls: crawls.filter(c => c.status === 'completed').length,
    totalUrls: crawls.reduce((sum, crawl) => sum + (crawl.urls?.length || 0), 0)
  }
})

// Inject the notification function
const showNotification = inject('showNotification')

// General dashboard methods
const openCrawl = (crawlId) => {
    router.push({ name: 'CrawlerDashboard', params: { crawlId } })
}

const editCrawl = (crawl) => {
    crawlStore.openCreateModal(crawl)
}

const openCreateModal = () => {
    crawlStore.openCreateModal()
}

const handleCrawlCreated = (crawl) => {
    crawlStore.closeCreateModal()
    showNotification('Crawl saved successfully', 'success')
    // Refresh the crawls list
    fetchCrawls({ page: 1, itemsPerPage: 50 })
}

const handleModalError = (errorMessage) => {
    showNotification(errorMessage, 'error')
}

const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return formatDateTime(dateString)
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
        // Delete each selected crawl
        for (const crawlId of selectedCrawls.value) {
            await del(`/api/deletecrawl/${crawlId}`)
        }
        
        showBulkDeleteConfirm.value = false
        selectedCrawls.value = []
        showNotification(`Successfully deleted ${selectedCrawls.value.length} crawls`, 'success')
        
        // Refresh the crawls list
        await fetchCrawls({ page: 1, itemsPerPage: 50 })
    } catch (error) {
        showNotification(error.message, 'error')
        showBulkDeleteConfirm.value = false
    }
}
</script>

<style scoped>
.v-card {
    margin-bottom: 1rem;
}
</style>
