<template>
  <div class="container mx-auto px-4 mt-8">
    <div class="flex space-x-4">
      <!-- Sidebar Actions -->
      <div class="w-1/4 space-y-2">
        <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ crawl.title }}</h3>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-700">Status:</span>
              <StatusPill :status="crawl.status" />
            </div>
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm text-gray-600">Created: {{ formatDateTime(crawl.startTime) }}</span>
            </div>
            <div v-if="crawl.endTime" class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm text-gray-600">Last Run: {{ formatDateTime(crawl.endTime) }}</span>
            </div>
          </div>
          
          <!-- Latest Export Link -->
          <div v-if="latestExportLink" class="mt-4 pt-4 border-t border-gray-200">
            <h6 class="font-semibold text-gray-700 mb-2">Latest Export</h6>
            <a
              :href="latestExportLink"
              target="_blank"
              class="inline-flex items-center w-full px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Open Google Sheet
            </a>
            <div class="text-xs text-gray-500 mt-1">
              Exported: {{ formatDateTime(latestExportDate) }}
            </div>
          </div>
        </div>

        <!-- Actions Panel -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h6 class="font-semibold text-gray-700 mb-4">Actions</h6>
          <div class="space-y-2">
            <button
              @click="configureCrawl"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Configure
            </button>
            <button
              @click="confirmDeleteCrawlData"
              :disabled="!hasCrawlData"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Data
            </button>
            <button
              @click="confirmDelete"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete Crawl
            </button>
            <button
              @click="startCrawl"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ crawl?.status === 'pending' ? 'Start' : 'Restart' }}
            </button>
            <button
              @click="clearCrawlQueue"
              :disabled="clearQueueLoading"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Queue
            </button>
            <button
              @click="showExportModal = true"
              :disabled="!hasCrawlData"
              class="w-full inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export with Changes
            </button>
          </div>
        </div>

        <!-- Proxy Stats Widget -->
        <div class="bg-white rounded-lg shadow-sm p-6">
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

      <!-- Crawl Summary and Details -->
      <div class="w-3/4">
        <!-- Crawl Details -->
        <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h6 class="text-gray-700 font-semibold">Crawl Details</h6>
            <div class="flex items-center space-x-4">
              <!-- Bulk Delete Button -->
              <button
                v-if="selectedUrls.length > 0"
                @click="confirmBulkDelete"
                class="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Clear Selected ({{ selectedUrls.length }})
              </button>
              <!-- Restart Selected Button -->
              <button
                v-if="selectedUrls.length > 0"
                @click="confirmRestartSelected"
                class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Restart Selected ({{ selectedUrls.length }})
              </button>
              <!-- Queue Status -->
              <div class="text-sm text-gray-600">
                <span v-if="queueStatus.total > 0">
                  Queue: {{ queueStatus.active }} active, {{ queueStatus.waiting }} waiting
                </span>
              </div>
            </div>
          </div>
          
          <!-- URLs Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      v-model="selectAll"
                      @change="toggleSelectAll"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="url in crawl.urls" :key="url" class="hover:bg-gray-50">
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
                      {{ excerpts[url]?.excerpt || url }}
                      <button
                        v-if="url.length > 30"
                        @click="excerpts[url]?.toggleExpand"
                        class="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {{ excerpts[url]?.isExpanded ? 'Read less' : 'Read more' }}
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button
                        @click="openViewResult(url)"
                        class="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        v-if="hasUrlData(url)"
                        @click="confirmDeleteUrlData(url)"
                        class="text-yellow-600 hover:text-yellow-900"
                      >
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

    <!-- SlideOver for ViewResult -->
    <SlideOver v-if="Object.keys(viewResults).length > 0" @close-slide-over="closeAllSlideOvers">
      <template v-slot:title>
        {{ getCurrentSlideOverTitle() }}
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

    <!-- Confirmation Modals -->
    <ConfirmationModal
      v-model="showConfirm"
      title="Confirm Deletion"
      message="Are you sure you want to delete this crawl? This action cannot be undone."
      confirm-text="Delete"
      cancel-text="Cancel"
      color="error"
      icon="mdi-delete"
      @confirm="deleteCrawl"
    />
    
    <ConfirmationModal
      v-model="showDeleteDataConfirm"
      title="Clear Crawl Data"
      message="Are you sure you want to clear all crawled data for this crawl? The crawl configuration will remain intact, but all collected data will be deleted."
      confirm-text="Clear Data"
      cancel-text="Cancel"
      color="warning"
      icon="mdi-delete-sweep"
      @confirm="deleteCrawlData"
    />

    <ConfirmationModal
      v-model="showDeleteUrlDataConfirm"
      title="Clear URL Data"
      message="Are you sure you want to clear the crawled data for this URL?"
      :details="urlToDelete"
      confirm-text="Clear Data"
      cancel-text="Cancel"
      color="warning"
      icon="mdi-delete-sweep"
      @confirm="deleteUrlData"
    />

    <ConfirmationModal
      v-model="showBulkDeleteConfirm"
      title="Clear Selected URL Data"
      message="Are you sure you want to clear the crawled data for the selected URLs?"
      :items="selectedUrls"
      confirm-text="Clear Data"
      cancel-text="Cancel"
      color="warning"
      icon="mdi-delete-sweep"
      @confirm="bulkDeleteUrlData"
    />

    <ConfirmationModal
      v-model="showRestartSelectedConfirm"
      title="Restart Selected URLs"
      message="Are you sure you want to restart the crawl for the selected URLs?"
      :items="selectedUrls"
      confirm-text="Restart"
      cancel-text="Cancel"
      color="info"
      icon="mdi-restart"
      @confirm="restartSelectedUrls"
    />

    <!-- Modals -->
    <CreateCrawlModal
      v-model="showCreateModal"
      :crawl-data="crawl"
      @crawl-created="handleCrawlCreated"
      @error="handleModalError"
    />

    <ExportModal
      v-model="showExportModal"
      :crawl-id="crawlId"
      :crawl-title="crawl?.title"
      @export-success="handleExportSuccess"
    />

    <ProxyStatsModal
      v-model="showProxyStatsModal"
      :crawl-id="crawlId"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch, inject, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ViewResult from './ViewResult.vue'
import { useExcerpts } from '../composables/useExcerpts'
import SlideOver from './SlideOver.vue'
import { formatDateTime } from '../utils/commonUtils'
import CreateCrawlModal from './CreateCrawlModal.vue'
import ExportModal from './ExportModal.vue'
import ProxyStatsWidget from './ui/ProxyStatsWidget.vue'
import ProxyStatsModal from './ProxyStatsModal.vue'
import ConfirmationModal from './ui/ConfirmationModal.vue'
import StatusPill from './ui/StatusPill.vue'
import { useProxyStats } from '../composables/useProxyStats'
import { useSocketConnection } from '../composables/useSocketConnection'
import { useApiService } from '../composables/useApiService'
import { saveExportMetadata, loadExportMetadata } from '../utils/exportUtils'

// Props
const props = defineProps({
  crawlId: {
    type: String,
    required: true
  }
})

// Initialize composables
const { socket, isConnected, logs, joinRoom, on, disconnect } = useSocketConnection()
const { get, post, del, loading: apiLoading, error: apiError } = useApiService()

const route = useRoute()
const router = useRouter()
const crawl = ref(null)
const errorMessage = ref('')
const liveStatusDictionary = ref({})
const viewResults = ref({})
const excerpts = ref({})
const showConfirm = ref(false)
const showCreateModal = ref(false)
const showExportMenu = ref(false)
const queueStatus = ref({ active: 0, waiting: 0, delayed: 0, total: 0 })

// Add snackbar refs
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Add delete crawl data refs
const showDeleteDataConfirm = ref(false)
const showDeleteUrlDataConfirm = ref(false)
const urlToDelete = ref('')

// Add bulk delete refs for specific crawl dashboard
const selectedUrls = ref([])
const selectAll = ref(false)

// Add restart selected refs
const showRestartSelectedConfirm = ref(false)

// Add export tracking refs
const latestExportLink = ref('')
const latestExportDate = ref(null)

// Add clear queue loading ref
const clearQueueLoading = ref(false)

// Add proxy stats refs
const showProxyStatsModal = ref(false)
const showExportModal = ref(false)

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

// Function to clear live status dictionary
const clearLiveStatusDictionary = () => {
    liveStatusDictionary.value = {};
}

// Function to update live status for a specific URL
const updateLiveStatus = (url, status) => {
    if (url) {
        liveStatusDictionary.value[url] = status;
    }
}

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
const hasCrawlData = computed(() => {
    if (!crawl.value?.aggregatedData) return false
    return Object.values(crawl.value.aggregatedData).some(urlData => urlData && urlData.length > 0)
})

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

// Function to fetch crawl data from the server
const fetchCrawlData = async () => {
    try {
        const data = await get(`/api/getcrawler/${props.crawlId}`)
        crawl.value = data

        // Initialize aggregatedData if it doesn't exist
        if (!crawl.value.aggregatedData) {
            crawl.value.aggregatedData = {}
        }

        // Initialize excerpts for each URL
        crawl.value.urls.forEach((url) => {
            // Initialize aggregatedData for this URL if it doesn't exist
            if (!crawl.value.aggregatedData[url]) {
                crawl.value.aggregatedData[url] = []
            }
            // Initialize excerpt
            excerpts.value[url] = useExcerpts(ref(url), 30)
        })

        // Clear any stale 'started' statuses if crawl is completed
        if (crawl.value.status === 'completed' || crawl.value.status === 'failed') {
            clearLiveStatusDictionary()
        }
    } catch (error) {
        errorMessage.value = error.message
    }
}

// Function to fetch proxy stats
const fetchProxyStats = async () => {
    try {
        await fetchCrawlProxyStats(props.crawlId)
    } catch (error) {
        console.error('Error fetching proxy stats:', error)
    }
}

// Initialize Socket.io connection on component mount
onMounted(async () => {
    try {
        await fetchCrawlData()
        await fetchProxyStats()

        // Load saved export link from localStorage
        const savedExport = loadExportMetadata(props.crawlId)
        if (savedExport) {
            latestExportLink.value = savedExport.sheetUrl
            latestExportDate.value = new Date(savedExport.exportDate)
        }

        // Join the room for the specific crawl ID
        joinRoom(props.crawlId)
        
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
watch(() => props.crawlId, async (newCrawlId, oldCrawlId) => {
    if (newCrawlId && newCrawlId !== oldCrawlId) {
        console.log('CrawlDetailsView: crawlId changed from', oldCrawlId, 'to', newCrawlId)
        try {
            // Clear previous data
            crawl.value = null
            errorMessage.value = ''
            
            // Fetch new crawl data
            await fetchCrawlData()
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
    showCreateModal.value = true
}

const startCrawl = async () => {
    try {
        const requestBody = {
            urls: crawl.value.urls,
            crawlId: props.crawlId,
            selectors: crawl.value.selectors || []
        }
        // Make a POST request to start the crawl
        await post('/api/startcrawl', requestBody)
        crawl.value.status = 'in-progress'
        showNotification('Crawl started successfully', 'success')
    } catch (error) {
        showNotification(error.message, 'error')
    }
}

// Function to show the confirmation modal
const confirmDelete = () => {
    showConfirm.value = true
}

const deleteCrawl = async () => {
    try {
        await del(`/api/deletecrawl/${props.crawlId}`)
        showConfirm.value = false
        showNotification('Crawl deleted successfully', 'success')
        router.push('/dashboard')  // Redirect to dashboard
    } catch (error) {
        showNotification(error.message, 'error')
        showConfirm.value = false
    }
}

// Handler for crawl creation/update (specific crawl dashboard)
const handleCrawlCreated = (updatedCrawl) => {
    showNotification('Crawl updated successfully', 'success')
    fetchCrawlData()
}

// Error handler for modal (specific crawl dashboard)
const handleModalError = (errorMessage) => {
    showSnackbar.value = true
    snackbarText.value = errorMessage
    snackbarColor.value = 'error'
}

// Handle successful export
const handleExportSuccess = (exportResult) => {
    latestExportLink.value = exportResult.sheetUrl
    latestExportDate.value = exportResult.exportDate
    
    // Save to localStorage for persistence
    saveExportMetadata(props.crawlId, {
        sheetUrl: exportResult.sheetUrl,
        exportDate: exportResult.exportDate
    })
    
    showNotification('Export completed successfully!', 'success')
}

// Delete crawl data functions
const confirmDeleteCrawlData = () => {
    showDeleteDataConfirm.value = true
}

const deleteCrawlData = async () => {
    try {
        const response = await del(`/api/deletecrawldata/${props.crawlId}`)
        showDeleteDataConfirm.value = false
        showNotification(`Crawl data cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.message, 'error')
        showDeleteDataConfirm.value = false
    }
}

const confirmDeleteUrlData = (url) => {
    urlToDelete.value = url
    showDeleteUrlDataConfirm.value = true
}

const deleteUrlData = async () => {
    try {
        const response = await del(`/api/deletecrawldata/${props.crawlId}/urls`, {
            data: {
                urls: [urlToDelete.value]
            }
        })
        showDeleteUrlDataConfirm.value = false
        urlToDelete.value = ''
        showNotification(`URL data cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.message, 'error')
        showDeleteUrlDataConfirm.value = false
    }
}

// Bulk delete functions
const confirmBulkDelete = () => {
    showBulkDeleteConfirm.value = true
}

const bulkDeleteUrlData = async () => {
    try {
        const response = await del(`/api/deletecrawldata/${props.crawlId}/urls`, {
            data: {
                urls: selectedUrls.value
            }
        })
        showBulkDeleteConfirm.value = false
        selectedUrls.value = []
        selectAll.value = false
        showNotification(`Selected URLs cleared successfully. Deleted ${response.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.message, 'error')
        showBulkDeleteConfirm.value = false
    }
}

// Restart selected functions
const confirmRestartSelected = () => {
    showRestartSelectedConfirm.value = true
}

const restartSelectedUrls = async () => {
    try {
        const requestBody = {
            urls: selectedUrls.value,
            crawlId: props.crawlId,
            selectors: crawl.value.selectors || []
        }
        // Make a POST request to start the crawl with selected URLs
        await post('/api/startcrawl', requestBody)
        crawl.value.status = 'in-progress'
        showRestartSelectedConfirm.value = false
        selectedUrls.value = []
        selectAll.value = false
        showNotification(`Restarted crawl for ${requestBody.urls.length} selected URLs`, 'success')
    } catch (error) {
        showNotification(error.message, 'error')
        showRestartSelectedConfirm.value = false
    }
}

// Clear crawl queue function
const clearCrawlQueue = async () => {
    clearQueueLoading.value = true
    try {
        await del(`/api/clearqueue/${props.crawlId}`)
        snackbarText.value = 'Queue cleared!'
        snackbarColor.value = 'success'
        showSnackbar.value = true
    } catch (error) {
        snackbarText.value = error.message
        snackbarColor.value = 'error'
        showSnackbar.value = true
    } finally {
        clearQueueLoading.value = false
    }
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

