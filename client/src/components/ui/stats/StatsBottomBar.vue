<template>
  <!-- Fixed Bottom Stats Bar -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-3">
        <!-- Dynamic Stats and Actions Component -->
        <component :is="currentStatsComponent" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStatsBarStore } from '../../../stores/statsBarStore'
import GlobalStatsBar from './contexts/GlobalStatsBar.vue'
import CrawlDetailsStatsBar from './contexts/CrawlDetailsStatsBar.vue'

const statsBarStore = useStatsBarStore()

// Dynamic component selection based on context
const currentStatsComponent = computed(() => {
  switch (statsBarStore.currentContext) {
    case 'crawl-details':
      return CrawlDetailsStatsBar
    case 'global':
    default:
      return GlobalStatsBar
  }
})
</script>
