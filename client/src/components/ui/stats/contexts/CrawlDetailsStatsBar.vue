<template>
  <div class="flex items-center justify-between w-full">
    <!-- Stats Section -->
    <div class="flex items-center space-x-8">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Crawl: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-24 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ contextData.title || 'Loading...' }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Status: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-16 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ contextData.status || 'Loading...' }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
        <span class="text-sm text-gray-600">URLs: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ contextData.totalUrls || 0 }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Completed: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ contextData.completedUrls || 0 }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Failed: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ contextData.failedUrls || 0 }}</span>
        </span>
      </div>
    </div>
    <!-- Proxy Stats Integration -->
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 bg-cyan-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Proxy:
         <span v-if="proxyStatsLoading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
         <span v-else-if="proxyStatsDisplay.hasData">
            <span class="font-semibold text-gray-900">{{ formatNumber(proxyStatsDisplay.requests) }}</span>
            <span class="text-xs text-gray-500 ml-1">({{ formatPercentage(proxyStatsDisplay.successRate) }})</span>
          </span>
         <span v-else class="font-semibold text-gray-900">0</span>
        </span>
      <button
        @click="statsBarStore.openProxyModal()"
        class="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100 hover:border-cyan-300 transition-colors duration-200"
        title="View detailed proxy analytics"
      >
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Details
      </button>
    </div>

    <!-- Actions Section -->
    <div class="flex items-center space-x-3">
      <button
        @click="handleRefresh"
        :disabled="loading || actionsLoading"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
      
      <!-- Dropdown Actions -->
      <div class="relative" ref="dropdownRef">
        <button
          @click="toggleDropdown"
          :disabled="loading || actionsLoading"
          class="inline-flex items-center px-4 py-2 text-sm font-bold text-gray-800 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
          Actions
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>

        <!-- Dropdown Menu (Drop Up) -->
        <div
          v-if="showDropdown"
          class="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
        >
          <!-- Small arrow pointing down -->
          <div class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
          <div class="py-1">
            <!-- Configure -->
            <button
              @click="handleConfigure"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Configure
            </button>

            <!-- Start/Restart -->
            <button
              @click="handleStartCrawl"
              :disabled="loading || actionsLoading"
              class="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ loading ? 'Loading...' : (contextData.status === 'pending' ? 'Start' : 'Restart') }}
            </button>

            <!-- Export -->
            <button
              @click="handleExportCrawl"
              :disabled="loading || actionsLoading || !contextData.hasData"
              class="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export with Changes
            </button>

            <div class="border-t border-gray-100"></div>

            <!-- Clear Data -->
            <button
              @click="handleClearData"
              :disabled="loading || actionsLoading || !contextData.hasData"
              class="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Data
            </button>

            <!-- Clear Queue -->
            <button
              @click="handleClearQueue"
              :disabled="loading || actionsLoading"
              class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Queue
            </button>

            <div class="border-t border-gray-100"></div>

            <!-- Delete Crawl -->
            <button
              @click="handleDeleteCrawl"
              :disabled="loading || actionsLoading"
              class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete Crawl
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import { useStatsBarStore } from '../../../../stores/statsBarStore'
import { useCrawlStore } from '../../../../stores/crawlStore'
import { useCrawlActions } from '../../../../composables/useCrawlActions'
import { formatNumber, formatPercentage } from '../../../../utils/formattingUtils'

// No props needed - proxy stats come from store

const statsBarStore = useStatsBarStore()
const crawlStore = useCrawlStore()
const {
  clearQueueLoading,
  deleteLoading,
  exportLoading,
  confirmDeleteCrawl,
  confirmDeleteCrawlData,
  confirmClearCrawlQueue,
  startCrawl,
  exportCrawl,
  refreshCrawl,
  configureCrawl
} = useCrawlActions()
const showNotification = inject('showNotification')

const contextData = computed(() => statsBarStore.contextData)
const proxyStats = computed(() => statsBarStore.proxyStats)
const proxyStatsLoading = computed(() => statsBarStore.proxyStatsLoading)

// Computed property for proxy stats display
const proxyStatsDisplay = computed(() => {
  if (!proxyStats.value || !proxyStats.value.summary) {
    return {
      requests: 0,
      successRate: 0,
      hasData: false
    }
  }
  
  const { totalProxyRequests = 0, totalSuccessCount = 0 } = proxyStats.value.summary
  const successRate = totalProxyRequests > 0 ? (totalSuccessCount / totalProxyRequests) * 100 : 0
  
  return {
    requests: totalProxyRequests,
    successRate,
    hasData: true
  }
})

// Dropdown state
const showDropdown = ref(false)
const dropdownRef = ref(null)

// Loading state - show loading when context data is not yet available or when actions are loading
const loading = computed(() => {
  // Show loading if we're in crawl-details context but don't have proper data yet
  if (statsBarStore.currentContext === 'crawl-details') {
    return !contextData.value.title || 
           contextData.value.title === 'Loading...' || 
           contextData.value.totalUrls === undefined
  }
  return false
})

// Combined loading state for actions
const actionsLoading = computed(() => {
  return clearQueueLoading.value || deleteLoading.value || exportLoading.value
})

// Dropdown functionality
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Actions
const handleRefresh = () => {
  refreshCrawl(contextData.value.crawlId)
  closeDropdown()
}

const handleConfigure = () => {
  configureCrawl(contextData.value.crawlId)
  closeDropdown()
}

const handleStartCrawl = async () => {
  await startCrawl(
    contextData.value.crawlId,
    [], // URLs - would need to be passed from context
    [] // Selectors - would need to be passed from context
  )
  closeDropdown()
}

const handleExportCrawl = async () => {
  await exportCrawl(contextData.value.crawlId)
  closeDropdown()
}

const handleClearData = () => {
  confirmDeleteCrawlData(contextData.value.crawlId)
  closeDropdown()
}

const handleClearQueue = () => {
  confirmClearCrawlQueue(contextData.value.crawlId)
  closeDropdown()
}

const handleDeleteCrawl = () => {
  confirmDeleteCrawl(contextData.value.crawlId, true)
  closeDropdown()
}
</script>
