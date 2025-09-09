<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button
                @click="$router.push('/')"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Back to Dashboard
              </button>
              <div class="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ crawl?.title || 'Loading...' }}</h1>
                <div class="flex items-center space-x-4 mt-1">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">Status:</span>
                    <StatusPill :status="crawl?.status" />
                  </div>
                  <div class="flex items-center space-x-2 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Created {{ formatDate(crawl?.startTime) }}</span>
                  </div>
                  <div v-if="crawl?.endTime" class="flex items-center space-x-2 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Last Run {{ formatDate(crawl.endTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <button
                @click="configureCrawl"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Configure
              </button>
              <button
                @click="handleStartCrawl"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ crawl?.status === 'pending' ? 'Start Crawl' : 'Restart Crawl' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Latest Export Card -->
          <div v-if="latestExportLink" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Latest Export</h3>
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <a
              :href="latestExportLink"
              target="_blank"
              class="inline-flex items-center w-full px-4 py-3 border border-green-200 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
            >
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Open Google Sheet
            </a>
            <div class="text-xs text-gray-500 mt-3">
              Exported {{ formatDate(latestExportDate) }}
            </div>
          </div>


          <!-- Proxy Stats Widget -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <ProxyStatsWidget
              :stats="formattedCrawlStats"
              :detailed-stats="detailedProxyStats"
              :loading="proxyStatsLoading"
              :error="proxyStatsError"
              @refresh="fetchProxyStats"
              @view-details="showProxyStatsModal = true"
            />
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="lg:col-span-3">
          <!-- Crawl Details Card -->
          <div v-if="crawl" class="bg-white rounded-xl shadow-sm border border-gray-200">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Crawl URLs</h2>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ crawl.urls?.length || 0 }} URLs • 
                    <span v-if="queueStatus.total > 0">
                      {{ queueStatus.active }} active, {{ queueStatus.waiting }} waiting in queue
                    </span>
                    <span v-else>No active queue</span>
                  </p>
                </div>
                <div class="flex items-center space-x-3">
                  <!-- Bulk Actions -->
                  <div v-if="selectedUrls.length > 0" class="flex items-center space-x-2">
                    <span class="text-sm text-gray-500">{{ selectedUrls.length }} selected</span>
                    <button
                      @click="confirmBulkDelete"
                      class="inline-flex items-center px-3 py-2 border border-yellow-200 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                      Clear Selected
                    </button>
                    <button
                      @click="confirmRestartSelected"
                      class="inline-flex items-center px-3 py-2 border border-blue-200 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                    >
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Restart Selected
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- URLs Table -->
            <div class="overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-4 text-left">
                        <input
                          v-model="selectAll"
                          @change="toggleSelectAll"
                          type="checkbox"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">URL</th>
                      <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-100">
                    <tr v-for="url in crawl.urls" :key="url" class="hover:bg-gray-50 transition-colors duration-150">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input
                          v-model="selectedUrls"
                          :value="url"
                          type="checkbox"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">
                          <div class="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block max-w-md truncate">
                            {{ excerpts[url]?.excerpt || url }}
                          </div>
                          <button
                            v-if="url.length > 30"
                            @click="excerpts[url]?.toggleExpand"
                            class="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            {{ excerpts[url]?.isExpanded ? 'Show less' : 'Show more' }}
                          </button>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div v-if="liveStatusDictionary?.[url] === 'started' && crawl?.status !== 'completed' && crawl?.status !== 'failed'" class="flex items-center">
                          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span class="ml-2 text-sm text-gray-600">Processing...</span>
                        </div>
                        <StatusPill
                          v-else-if="liveStatusDictionary[url] || crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.status"
                          :status="liveStatusDictionary[url] || crawl.aggregatedData[url][crawl.aggregatedData[url].length - 1]?.status"
                        />
                        <StatusPill
                          v-else
                          status="pending"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-3">
                          <button
                            @click="openViewResult(url)"
                            class="inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                          >
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            View
                          </button>
                          <button
                            v-if="hasUrlData(url)"
                            @click="confirmDeleteUrlData(url)"
                            class="inline-flex items-center px-3 py-1.5 border border-yellow-200 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors duration-200"
                          >
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
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
          v-if="isOpen"
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
import { onMounted, ref, watch, inject, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ViewResult from '../features/crawl/ViewResult.vue'
import SlideOver from '../features/proxy/SlideOver.vue'
import { formatDate } from '../../utils/formattingUtils'
import ProxyStatsWidget from '../ui/stats/ProxyStatsWidget.vue'
import ProxyStatsModal from '../modals/ProxyStatsModal.vue'
import StatusPill from '../ui/data/StatusPill.vue'
import { useProxyStats } from '../../composables/useProxyStats'
import { useSocketConnection } from '../../composables/useSocketConnection'
import { useApiService } from '../../composables/useApiService'
import { useCrawlActions } from '../../composables/useCrawlActions'
import { useCrawlData } from '../../composables/useCrawlData'
import { useCrawlStore } from '../../stores/crawlStore'
import { saveExportMetadata, loadExportMetadata } from '../../utils/fileUtils'

// Get crawlId from route params
const route = useRoute()
const router = useRouter()
const crawlId = computed(() => route.params.crawlId)

// Initialize composables
const { socket, isConnected, joinRoom, on, disconnect } = useSocketConnection()
const { get, post, del, loading: apiLoading, error: apiError } = useApiService()
const { confirmDeleteUrlData, confirmRestartSelectedUrls, startCrawl } = useCrawlActions()
const { crawl, errorMessage, excerpts, liveStatusDictionary, hasCrawlData, fetchCrawlData, refreshCrawlData, clearLiveStatusDictionary, updateLiveStatus } = useCrawlData()
const crawlStore = useCrawlStore()

const viewResults = ref({})
const logs = ref([])
const queueStatus = ref({ active: 0, waiting: 0, delayed: 0, total: 0 })

// Add bulk delete refs for specific crawl dashboard
const selectedUrls = ref([])
const selectAll = ref(false)

// Add export tracking refs
const latestExportLink = ref('')
const latestExportDate = ref(null)

// Add clear queue loading ref
const clearQueueLoading = ref(false)

// Add proxy stats refs
const showProxyStatsModal = ref(false)

// Initialize proxy stats composable
const {
  proxyStats,
  loading: proxyStatsLoading,
  error: proxyStatsError,
  fetchCrawlProxyStats,
  formattedCrawlStats,
  formattedGlobalStats
} = useProxyStats()


// Computed properties for proxy stats
const detailedProxyStats = computed(() => proxyStats.value)

// Inject the notification function
const showNotification = inject('showNotification')

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
    } catch (error) {
        console.error('Error fetching proxy stats:', error)
    }
}

// Initialize Socket.io connection on component mount
onMounted(async () => {
    try {
        await fetchCrawlData(crawlId.value)
        await fetchProxyStats()

        // Load saved export link from localStorage
        const savedExport = loadExportMetadata(crawlId.value)
        if (savedExport) {
            latestExportLink.value = savedExport.sheetUrl
            latestExportDate.value = new Date(savedExport.exportDate)
        }

        // Join the room for the specific crawl ID
        joinRoom(crawlId.value)
        
        // Listen for crawl logs
        on("crawlLog", async (data) => {
            logs.value.push(data)
            
            // Update crawl status if it's a final status update
            if (data.status === 'completed' || data.status === 'failed') {
                crawl.value.status = data.status
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
            } else if (data.url) {
                // Update individual URL status using helper function
                updateLiveStatus(data.url, data.status);
            }

            // Append new crawled data into FE rather than making a new api call
            if (data.status === 'success') {
                crawl.value.aggregatedData[data.url]
                    .push({ data: data.result, date: new Date(), status: data.status })
            }
        })

    } catch (error) {
        console.error('Component initialization error:', error)
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
            
            // Fetch new crawl data
            await fetchCrawlData(newCrawlId)
            await fetchProxyStats()
            
            // Load saved export link for new crawl
            const savedExport = loadExportMetadata(newCrawlId)
            if (savedExport) {
                latestExportLink.value = savedExport.sheetUrl
                latestExportDate.value = new Date(savedExport.exportDate)
            }
            
            // Join the room for the new crawl ID
            joinRoom(newCrawlId)
        } catch (error) {
            console.error('Error loading new crawl data:', error)
            errorMessage.value = 'Failed to load crawl data'
        }
    }
})

// Cleanup function when component unmounts
onUnmounted(() => {
    disconnect()
    // Clear live status dictionary
    clearLiveStatusDictionary()
})

const configureCrawl = () => {
    crawlStore.setSelectedCrawl(crawl.value)
    crawlStore.openCreateModal()
}

// Use shared action functions
const handleStartCrawl = async () => {
    await startCrawl(crawlId.value, crawl.value.urls, crawl.value.selectors || [])
    crawl.value.status = 'in-progress'
}


// Handler for crawl creation/update (specific crawl dashboard)
const handleCrawlCreated = (updatedCrawl) => {
    showNotification('Crawl updated successfully', 'success')
    fetchCrawlData(crawlId.value)
}

// Error handler for modal (specific crawl dashboard)
const handleModalError = (errorMessage) => {
    showNotification(errorMessage, 'error')
}

// Handle successful export
const handleExportSuccess = (exportResult) => {
    latestExportLink.value = exportResult.sheetUrl
    latestExportDate.value = exportResult.exportDate
    
    // Save to localStorage for persistence
    saveExportMetadata(crawlId.value, {
        sheetUrl: exportResult.sheetUrl,
        exportDate: exportResult.exportDate
    })
    
    showNotification('Export completed successfully!', 'success')
}

// Bulk delete functions
const confirmBulkDelete = () => {
    confirmDeleteUrlData(crawlId.value, selectedUrls.value)
}

// Restart selected functions
const confirmRestartSelected = () => {
    confirmRestartSelectedUrls(crawlId.value, selectedUrls.value, crawl.value.selectors || [])
}

// Toggle select all
const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedUrls.value = crawl.value.urls
    } else {
        selectedUrls.value = []
    }
}

// Watch for changes in selectedUrls to update selectAll
watch(selectedUrls, (newSelectedUrls) => {
    if (crawl.value?.urls) {
        selectAll.value = newSelectedUrls.length === crawl.value.urls.length && crawl.value.urls.length > 0
    }
}, { deep: true })
</script>

