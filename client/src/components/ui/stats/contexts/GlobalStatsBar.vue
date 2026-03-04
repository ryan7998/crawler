<template>
  <div class="flex items-center justify-between w-full">
    <!-- Stats Section -->
    <div class="flex items-center space-x-8">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Total Crawls: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ stats.totalCrawls }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Active: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ stats.activeCrawls }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
        <span class="text-sm text-gray-600">Completed: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ stats.completedCrawls }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
        <span class="text-sm text-gray-600">URLs: 
          <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
          <span v-else class="font-semibold text-gray-900">{{ stats.totalUrls }}</span>
        </span>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="flex items-center space-x-3">
      <button
        @click="handleRefresh"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
      <button
        @click="handleExportAll"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
      >
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Export All
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCrawlStore } from '../../../../stores/crawlStore'
import { useNotification } from '../../../../composables/useNotification'

const crawlStore = useCrawlStore()
const { showNotification } = useNotification()

const stats = computed(() => crawlStore.crawlStats)
const loading = computed(() => crawlStore.crawlsLoading)

// Actions
const handleRefresh = () => {
  crawlStore.triggerRefresh()
}

const handleExportAll = () => {
  showNotification('Global export functionality coming soon!', 'info')
}
</script>
