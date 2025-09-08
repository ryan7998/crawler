<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Crawls Table -->
      <CrawlerTable
        :has-selected="hasSelectedCrawls"
        @crawl-click="openCrawl"
        @view-crawl="openCrawl"
        @edit-crawl="editCrawl"
        @bulk-export="handleBulkExport"
      />
    </div>
  </div>
</template>

<script setup>
import { 
  inject, 
  computed
} from 'vue'
import { useRouter } from 'vue-router'
import CrawlerTable from '../ui/data/CrawlerTable.vue'
import { useCrawlStore } from '../../stores/crawlStore'

const router = useRouter()

// Use the crawl store for modal state
const crawlStore = useCrawlStore()


// Inject the notification function
const showNotification = inject('showNotification')

// Memoized methods using computed for better performance
const openCrawl = (crawlId) => {
  router.push({ name: 'CrawlDetails', params: { crawlId } })
}

const editCrawl = (crawl) => {
  crawlStore.openCreateModal(crawl)
}

// Bulk export handler (needs notification access)
const handleBulkExport = () => {
  if (!crawlStore.canPerformBulkExport()) return
  // TODO: Implement bulk export functionality
  showNotification('Bulk export functionality coming soon!', 'info')
}


// Watch for changes in selected crawls to optimize bulk operations
const hasSelectedCrawls = computed(() => crawlStore.selectedCrawls.length > 0)



</script>
