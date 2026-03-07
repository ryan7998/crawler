<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <CrawlDetailsHeader 
      :crawl="crawl" 
      :loading="apiLoading"
      @configure="configureCrawl"
      @start="handleStartCrawl"
    />

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Main Content Area -->
        <div class="lg:col-span-3">
          <CrawlUrlsTable
            :crawl="crawl"
            :selected-urls="selectedUrls"
            :select-all="selectAll"
            :excerpts="excerpts"
            :live-status-dictionary="liveStatusDictionary"
            :queue-status="queueStatus"
            @toggle-select-all="toggleSelectAll"
            @toggle-url-selection="toggleUrlSelection"
            @bulk-delete="confirmBulkDelete"
            @bulk-restart="confirmRestartSelected"
            @view-result="openViewResult"
            @delete-url="confirmDeleteUrlData"
          />
        </div>

        <!-- Right Sidebar -->
        <CrawlDetailsSidebar
          :latest-export-link="latestExportLink"
          :latest-export-date="latestExportDate"
        />
      </div>
    </div>

    <!-- SlideOver for ViewResult -->
    <SlideOver v-if="Object.keys(viewResults).length > 0" @close-slide-over="closeAllSlideOvers">
      <template v-slot:title>
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span class="font-semibold text-gray-900">{{ getCurrentSlideOverTitle() }}</span>
        </div>
      </template>
      <template #default>
        <ViewResult 
          v-for="(isOpen, url) in viewResults" 
          :key="url"
          :data="crawl.aggregatedData[url]" 
          :url="url" 
        />
      </template>
    </SlideOver>

    <!-- Note: Confirmation modals are now handled by ModalWrapper.vue -->

    <!-- Component-specific modals only -->
    <ProxyStatsModal
      v-model="showProxyStatsModal"
      :crawl-id="crawlId"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, onUnmounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import ViewResult from '../features/crawl/ViewResult.vue'
import SlideOver from '../ui/SlideOver.vue'
import ProxyStatsModal from '../modals/ProxyStatsModal.vue'
import CrawlDetailsHeader from './components/CrawlDetailsHeader.vue'
import CrawlUrlsTable from './components/CrawlUrlsTable.vue'
import CrawlDetailsSidebar from './components/CrawlDetailsSidebar.vue'
import { useProxyStats } from '../../composables/useProxyStats'
import { useApiService } from '../../composables/useApiService'
import { useCrawlActions } from '../../composables/useCrawlActions'
import { useCrawlData } from '../../composables/useCrawlData'
import { useCrawlStore } from '../../stores/crawlStore'
import { useStatsBarStore } from '../../stores/statsBarStore'
import { useCrawlDetailsView } from '../../composables/useCrawlDetailsView'
import { useCrawlExport } from '../../composables/useCrawlExport'
import { useCrawlSocket } from '../../composables/useCrawlSocket'
import { useNotification } from '../../composables/useNotification'

// Get crawlId from route params
const route = useRoute()
const crawlId = computed(() => route.params.crawlId)

// Initialize composables
const { loading: apiLoading } = useApiService()
const { confirmDeleteUrlData, confirmRestartSelectedUrls, startCrawl } = useCrawlActions()
const { crawl, errorMessage, excerpts, liveStatusDictionary, fetchCrawlData, clearLiveStatusDictionary, updateLiveStatus } = useCrawlData()
const crawlStore = useCrawlStore()
const statsBarStore = useStatsBarStore()

const { selectedUrls, selectAll, toggleSelectAll, toggleUrlSelection } = useCrawlDetailsView(crawl)
const { latestExportLink, latestExportDate, loadExportData } = useCrawlExport(crawlId)
const { queueStatus, connectToCrawl, disconnectFromCrawl } = useCrawlSocket(crawlId, crawl, liveStatusDictionary, updateLiveStatus)
const { handleApiError } = useNotification()

const viewResults = shallowRef({})

// Initialize proxy stats composable
const {
  proxyStats,
  loading: proxyStatsLoading,
  fetchCrawlProxyStats,
} = useProxyStats()

// These functions are now provided by useCrawlData composable

// Watch for crawl status changes to clear live status when crawl completes
watch(() => crawl.value?.status, (newStatus) => {
    if (newStatus === 'completed' || newStatus === 'failed') {
        // Clear all 'started' statuses when crawl completes
        Object.keys(liveStatusDictionary.value).forEach(url => {
            if (liveStatusDictionary.value[url] === 'started') {
                // Check if this URL has a final status in aggregatedData
                const urlData = crawl.value.aggregatedData[url];
                if (urlData && urlData.length > 0) {
                    const lastEntry = urlData[urlData.length - 1];
                    liveStatusDictionary.value[url] = lastEntry.status;
                } else {
                    // If no data, mark as failed
                    liveStatusDictionary.value[url] = 'failed';
                }
            }
        });
    }
});

// Computed properties
const hasUrlData = (url) => {
    return crawl.value?.aggregatedData?.[url] && crawl.value.aggregatedData[url].length > 0
}

const openViewResult = (url) => {
    // Set the clicked URL to true in the viewResults object
    viewResults.value = { ...viewResults.value, [url]: true }
}

const closeAllSlideOvers = () => {
    viewResults.value = {}
}

const getCurrentSlideOverTitle = () => {
    const openUrl = Object.keys(viewResults.value).find(url => viewResults.value[url])
    if (openUrl && crawl.value?.aggregatedData?.[openUrl]) {
        const urlData = crawl.value.aggregatedData[openUrl]
        const lastEntry = urlData[urlData.length - 1]
        return lastEntry?.data?.defaultData?.title || openUrl
    }
    return 'View Result'
}

// fetchCrawlData is now provided by useCrawlData composable

// Function to fetch proxy stats
const fetchProxyStats = async () => {
    try {
        await fetchCrawlProxyStats(crawlId.value)
        // Update proxy stats in the stats bar store
        statsBarStore.setProxyStats(proxyStats.value)
    } catch (error) {
        console.error('Error fetching proxy stats:', error)
    }
}

// Sync proxy stats loading state to store
watch(proxyStatsLoading, (newLoading) => {
    statsBarStore.setProxyStatsLoading(newLoading)
})

// Proxy modal: writable computed so Close/X can update the store
const showProxyStatsModal = computed({
  get: () => statsBarStore.showProxyModal,
  set: (value) => {
    if (!value) statsBarStore.closeProxyModal()
  }
})

// Initialize component on mount
onMounted(async () => {
    try {
        await fetchCrawlData(crawlId.value)
        await fetchProxyStats()
        
        // Load export data
        loadExportData()
        
        // Connect to socket
        await connectToCrawl()


    } catch (error) {
        handleApiError(error, 'component initialization')
        errorMessage.value = error.message
    }
})

// Watch for crawlId changes to re-fetch data when navigating between crawls
watch(crawlId, async (newCrawlId, oldCrawlId) => {
    if (newCrawlId && newCrawlId !== oldCrawlId) {
        console.log('CrawlDetailsView: crawlId changed from', oldCrawlId, 'to', newCrawlId)
        try {
            // Clear previous data
            crawl.value = null
            errorMessage.value = ''

            await fetchCrawlData(newCrawlId)
            await fetchProxyStats()
            loadExportData()
        } catch (error) {
            console.error('Error loading new crawl data:', error)
            errorMessage.value = 'Failed to load crawl data'
        }
    }
})

// Cleanup function when component unmounts
onUnmounted(() => {
    disconnectFromCrawl()
    // Clear live status dictionary
    clearLiveStatusDictionary()
})

const configureCrawl = () => {
    crawlStore.openCreateModal(crawl.value)
}

// Use shared action functions
const handleStartCrawl = async () => {
    await startCrawl(crawlId.value, crawl.value.urls, crawl.value.selectors || [])
    crawl.value.status = 'in-progress'
}


// Re-fetch when ModalWrapper signals a save (create or update)
watch(() => crawlStore.refreshTrigger, () => {
    fetchCrawlData(crawlId.value)
})

// Handle successful export - now handled by useCrawlExport composable

// Bulk delete functions
const confirmBulkDelete = () => {
    confirmDeleteUrlData(crawlId.value, selectedUrls.value)
}

// Restart selected functions
const confirmRestartSelected = () => {
    confirmRestartSelectedUrls(crawlId.value, selectedUrls.value, crawl.value.selectors || [])
}

// URL selection is now handled by useCrawlDetailsView composable
</script>