<template>
  <!-- Fixed Bottom Stats Bar -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-3">
        <!-- Stats -->
        <div class="flex items-center space-x-8">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span class="text-sm text-gray-600">Total: 
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
        
        <!-- Quick Actions -->
        <div class="flex items-center space-x-3">
          <button
            @click="$emit('refresh')"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button
            @click="$emit('export-all')"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export All
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCrawlStore } from '../../../stores/crawlStore'

// Use the crawl store for stats
const crawlStore = useCrawlStore()

// Create a reactive reference to the stats
const stats = ref(crawlStore.crawlStats)

// Get loading state from store
const loading = computed(() => crawlStore.crawlsLoading)

// Watch for changes in the store's allCrawls array
watch(
  () => crawlStore.allCrawls,
  () => {
    // Update stats when crawls data changes
    stats.value = crawlStore.crawlStats
  },
  { deep: true, immediate: true }
)

defineEmits(['refresh', 'export-all'])
</script>
