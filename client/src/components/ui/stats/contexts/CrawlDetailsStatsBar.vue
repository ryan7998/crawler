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

    <!-- Actions Section -->
    <div class="flex items-center space-x-3">
      <button
        @click="handleRefresh"
        :disabled="loading"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
      <button
        @click="handleExportCrawl"
        :disabled="loading || !contextData.hasData"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Export Crawl
      </button>
      <button
        @click="handleStartCrawl"
        :disabled="loading"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ loading ? 'Loading...' : (contextData.status === 'pending' ? 'Start' : 'Restart') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useStatsBarStore } from '../../../../stores/statsBarStore'
import { useCrawlStore } from '../../../../stores/crawlStore'

const statsBarStore = useStatsBarStore()
const crawlStore = useCrawlStore()
const showNotification = inject('showNotification')

const contextData = computed(() => statsBarStore.contextData)

// Loading state - show loading when context data is not yet available
const loading = computed(() => {
  // Show loading if we're in crawl-details context but don't have proper data yet
  if (statsBarStore.currentContext === 'crawl-details') {
    return !contextData.value.title || 
           contextData.value.title === 'Loading...' || 
           contextData.value.totalUrls === undefined
  }
  return false
})

// Actions
const handleRefresh = () => {
  crawlStore.triggerRefresh()
}

const handleExportCrawl = () => {
  showNotification('Opening export modal for this crawl...', 'info')
}

const handleStartCrawl = () => {
  showNotification('Starting crawl...', 'info')
}
</script>
