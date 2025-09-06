<template>
  <div class="relative">
    <!-- Page Content -->
    <slot />
    
    <!-- Fixed Bottom Stats Bar -->
    <StatsBottomBar
      @refresh="handleRefresh"
      @export-all="handleGlobalExport"
    />
  </div>
</template>

<script setup>
import StatsBottomBar from './ui/StatsBottomBar.vue'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useCrawlStore } from '../stores/crawlStore'

// Use crawl management for stats bar
const { fetchCrawls } = useCrawlManagement()
const crawlStore = useCrawlStore()

// Stats bar handlers
const handleRefresh = () => {
  fetchCrawls({ page: 1, itemsPerPage: 50 })
}

const handleGlobalExport = () => {
  crawlStore.openGlobalExportModal()
}
</script>
