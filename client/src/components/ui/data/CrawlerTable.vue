<template>
  <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Crawls</h3>
          <p class="mt-1 text-sm text-gray-500">Manage your web crawls</p>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Bulk Actions -->
          <div v-if="selectedCrawls.length > 0" class="flex items-center space-x-2">
            <span class="text-sm text-gray-700">{{ selectedCrawls.length }} selected</span>
            <button
              @click="crawlStore.handleBulkDelete()"
              class="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete Selected
            </button>
            <button
              @click="handleBulkExport"
              class="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export Selected
            </button>
          </div>
          
          <!-- Search -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search crawls..."
              class="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="crawlsLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading crawls...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-600 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading crawls</h3>
      <p class="text-gray-500 mb-4">{{ error }}</p>
      <button
        @click="handleRetry"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCrawls.length === 0" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        {{ searchQuery ? 'No crawls found' : 'No crawls yet' }}
      </h3>
      <p class="text-gray-500 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first web crawl' }}
      </p>
      <button
        v-if="!searchQuery"
        @click="crawlStore.openCreateModal()"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Create Your First Crawl
      </button>
    </div>

    <!-- Table View -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                :checked="selectAll"
                @change="toggleSelectAll"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              @click="sortBy(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <svg 
                  v-if="sortField === column.key" 
                  :class="[
                    'w-4 h-4',
                    sortDirection === 'asc' ? 'transform rotate-180' : ''
                  ]"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="crawl in paginatedCrawls" 
            :key="crawl._id"
            :class="[
              'hover:bg-gray-50 cursor-pointer',
              crawl.disabled ? 'opacity-60 bg-gray-50' : ''
            ]"
            @click="openCrawl(crawl._id)"
          >
            <td class="px-6 py-4 whitespace-nowrap" @click.stop>
              <input
                :checked="selectedCrawls.includes(crawl._id)"
                @change="toggleCrawlSelection(crawl._id)"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">{{ crawl.title }}</div>
                  <div class="text-sm text-gray-500">{{ crawl.urls?.length || 0 }} URLs</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center space-x-2">
                <StatusPill :status="crawl.status" />
                <span v-if="crawl.disabled" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Disabled
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getRelativeTime(crawl.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ crawl.endTime ? getRelativeTime(crawl.endTime) : 'Never' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" @click.stop>
              <div class="flex items-center space-x-2">
                <!-- Toggle Switch -->
                <div class="flex items-center space-x-2">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      :checked="!crawl.disabled"
                      @change="toggleCrawlStatus(crawl._id)"
                      :disabled="disableLoadingId === crawl._id"
                      class="sr-only peer"
                    />
                    <div :class="[
                      'relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out',
                      crawl.disabled ? 'bg-gray-300' : 'bg-green-500',
                      disableLoadingId === crawl._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    ]">
                      <!-- Switch handle -->
                      <div :class="[
                        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ease-in-out flex items-center justify-center',
                        crawl.disabled ? 'translate-x-0' : 'translate-x-5'
                      ]">
                        <!-- Loading spinner inside the handle -->
                        <div v-if="disableLoadingId === crawl._id" class="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <!-- Check/X icon -->
                        <svg v-else-if="!crawl.disabled" class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                        <svg v-else class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                    <!-- Status label -->
                    <span :class="[
                      'ml-2 text-xs font-medium',
                      crawl.disabled ? 'text-gray-500' : 'text-green-600'
                    ]">
                      {{ crawl.disabled ? 'Disabled' : 'Enabled' }}
                    </span>
                  </label>
                </div>
                <button
                  @click="editCrawl(crawl)"
                  class="text-indigo-600 hover:text-indigo-900 focus:outline-none border-none bg-transparent px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  @click="crawlStore.confirmDeleteCrawl(crawl._id)"
                  class="text-red-600 hover:text-red-900 focus:outline-none border-none bg-transparent px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>


    <!-- Pagination -->
    <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
            to
            <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredCrawls.length) }}</span>
            of
            <span class="font-medium">{{ filteredCrawls.length }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
            
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                page === currentPage
                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
            
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { getRelativeTime } from '../../../utils/formattingUtils'
import StatusPill from './StatusPill.vue'
import { useCrawlStore } from '../../../stores/crawlStore'
import { useCrawlManagement } from '../../../composables/useCrawlManagement'

// No props needed - using hardcoded pagination

// Router for navigation
const router = useRouter()

// Use the crawl store for selected crawls
const crawlStore = useCrawlStore()

// Initialize crawl management for data fetching
const { fetchCrawls, toggleDisableCrawl, disableLoadingId } = useCrawlManagement()

// Inject the notification function
const showNotification = inject('showNotification')

// Navigation and action functions
const openCrawl = (crawlId) => {
  router.push({ name: 'CrawlDetails', params: { crawlId } })
}

const editCrawl = (crawl) => {
  crawlStore.openCreateModal(crawl)
}

// Local state
const searchQuery = ref('')
const currentPage = ref(1)
const selectAll = ref(false)
const sortField = ref('createdAt')
const sortDirection = ref('desc')
const itemsPerPage = 10

// Pagination options
const paginationOptions = { page: 1, itemsPerPage: 50 }

// Computed properties from store
const selectedCrawls = computed(() => crawlStore.selectedCrawls)
const allCrawls = computed(() => crawlStore.allCrawls)
const crawlsLoading = computed(() => crawlStore.crawlsLoading)
const error = computed(() => crawlStore.error)
const refreshTrigger = computed(() => crawlStore.refreshTrigger)

// Table columns configuration
const columns = [
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'endTime', label: 'Last Run' }
]

// Computed properties
const filteredCrawls = computed(() => {
  let filtered = allCrawls.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(crawl => 
      crawl.title?.toLowerCase().includes(query) ||
      crawl.status?.toLowerCase().includes(query) ||
      crawl._id?.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    let aVal = a[sortField.value]
    let bVal = b[sortField.value]

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredCrawls.value.length / itemsPerPage))

const paginatedCrawls = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCrawls.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Methods
const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const toggleCrawlSelection = (crawlId) => {
  crawlStore.toggleSelectedCrawl(crawlId)
}

const toggleSelectAll = () => {
  const currentlySelected = selectedCrawls.value.length
  const totalCrawls = allCrawls.value.length
  
  if (currentlySelected === totalCrawls && totalCrawls > 0) {
    // All crawls are selected, so deselect all
    crawlStore.clearSelectedCrawls()
  } else {
    // Not all crawls are selected, so select all crawls across all pages
    const allCrawlIds = allCrawls.value.map(crawl => crawl._id)
    crawlStore.setSelectedCrawls(allCrawlIds)
  }
}


// Watch for changes in selected crawls from store
watch([selectedCrawls, allCrawls], ([newSelected, newAllCrawls]) => {
  const isAllSelected = newSelected.length === newAllCrawls.length && newAllCrawls.length > 0
  selectAll.value = isAllSelected
}, { deep: true })

// Watch for refresh trigger from store
watch(refreshTrigger, () => {
  console.log('CrawlerTable: Refresh triggered, fetching crawls...')
  fetchCrawls(paginationOptions)
})

// Retry handler
const handleRetry = () => {
  fetchCrawls(paginationOptions)
}

// Bulk export handler
const handleBulkExport = () => {
  if (!crawlStore.canPerformBulkExport()) return
  // TODO: Implement bulk export functionality
  showNotification('Bulk export functionality coming soon!', 'info')
}

// Toggle crawl status handler
const toggleCrawlStatus = async (crawlId) => {
  const crawl = allCrawls.value.find(c => c._id === crawlId)
  if (!crawl) {
    showNotification('Crawl not found', 'error')
    return
  }
  
  try {
    await toggleDisableCrawl(crawl)
  } catch (error) {
    console.error('Error toggling crawl status:', error)
  }
}

// Watch for search changes to reset pagination
watch(searchQuery, () => {
  currentPage.value = 1
})

// Fetch crawls when component mounts
onMounted(() => {
  console.log('CrawlerTable: Mounted, fetching crawls...')
  fetchCrawls(paginationOptions)
})
</script>
