<template>
  <div class="border-t border-gray-200 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-8">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Total: 
            <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
            <span v-else class="font-semibold">{{ stats.totalCrawls }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Active: 
            <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
            <span v-else class="font-semibold">{{ stats.activeCrawls }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <span class="text-sm text-gray-600">Completed: 
            <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
            <span v-else class="font-semibold">{{ stats.completedCrawls }}</span>
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span class="text-sm text-gray-600">URLs: 
            <span v-if="loading" class="animate-pulse bg-gray-200 rounded h-4 w-8 inline-block"></span>
            <span v-else class="font-semibold">{{ stats.totalUrls }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCrawlStore } from '../../stores/crawlStore'

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
</script>
