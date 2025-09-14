<template>
  <div v-if="crawl" class="bg-white rounded-xl shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Crawl URLs</h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ crawl.urls?.length || 0 }} URLs • 
            <span v-if="queueStatus.total > 0">
              {{ queueStatus.active }} active, {{ queueStatus.waiting }} waiting in queue
            </span>
            <span v-else>No active queue</span>
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Bulk Actions -->
          <div v-if="selectedUrls.length > 0" class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">{{ selectedUrls.length }} selected</span>
            <button
              @click="$emit('bulk-delete')"
              :class="['inline-flex items-center px-3 py-2 border border-yellow-200 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors', ANIMATION_DURATIONS.NORMAL]"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Selected
            </button>
            <button
              @click="$emit('bulk-restart')"
              :class="['inline-flex items-center px-3 py-2 border border-blue-200 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors', ANIMATION_DURATIONS.NORMAL]"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Restart Selected
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- URLs Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left">
              <input
                :checked="selectAll"
                @change="$emit('toggle-select-all')"
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
          <tr v-for="url in crawl.urls" :key="url" :class="['hover:bg-gray-50 transition-colors', ANIMATION_DURATIONS.FAST]">
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                :checked="selectedUrls.includes(url)"
                @change="$emit('toggle-url-selection', url)"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900">
                <div class="px-2 py-1 rounded inline-block max-w-md">
                  {{ excerpts[url]?.excerpt || url }}
                </div>
                <button
                  v-if="url.length > 30"
                  @click="excerpts[url]?.toggleExpand"
                  class="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  {{ excerpts[url]?.isExpanded ? 'Show less' : 'Show more' }}
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
                :status="liveStatusDictionary[url] || crawl.aggregatedData[url][crawl.aggregatedData[url].length - 1]?.status || 'pending'"
              />
              <StatusPill
                v-else
                status="pending"
              />
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center space-x-2">
                <button
                  @click="$emit('view-result', url)"
                  class="text-indigo-600 hover:text-indigo-900 focus:outline-none border-none bg-transparent px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                >
                  View
                </button>
                <button
                  v-if="hasUrlData(url)"
                  @click="$emit('delete-url', url)"
                  class="text-red-600 hover:text-red-900 focus:outline-none border-none bg-transparent px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
</template>

<script setup>
import { computed, shallowRef } from 'vue'
import StatusPill from '../../ui/data/StatusPill.vue'
import { processTableData, getBulkActionsConfig, getTableHeaders, getRowActions } from '../../../utils/tableOperationsUtils'
import { CRAWL_STATUSES, URL_STATUSES, BUTTON_VARIANTS, TABLE_CONFIG, ANIMATION_DURATIONS } from '../../../constants/crawlDetailsConstants'
import { memoize, shallowEqual } from '../../../utils/performanceUtils'

// Props
const props = defineProps({
  crawl: {
    type: Object,
    default: null
  },
  selectedUrls: {
    type: Array,
    default: () => []
  },
  selectAll: {
    type: Boolean,
    default: false
  },
  excerpts: {
    type: Object,
    default: () => ({})
  },
  liveStatusDictionary: {
    type: Object,
    default: () => ({})
  },
  queueStatus: {
    type: Object,
    default: () => ({ active: 0, waiting: 0, delayed: 0, total: 0 })
  }
})

// Emits
defineEmits([
  'toggle-select-all',
  'toggle-url-selection',
  'bulk-delete',
  'bulk-restart',
  'view-result',
  'delete-url'
])

// Memoized functions for performance
const memoizedProcessTableData = memoize(processTableData, (urls, excerpts, liveStatusDictionary, crawl) => 
  `${urls.length}-${Object.keys(excerpts).length}-${Object.keys(liveStatusDictionary).length}-${crawl?.id}`
)

const memoizedGetBulkActions = memoize(getBulkActionsConfig)

const memoizedGetRowActions = memoize(getRowActions)

// Computed properties
const tableData = computed(() => {
  return memoizedProcessTableData(
    props.crawl?.urls || [],
    props.excerpts,
    props.liveStatusDictionary,
    props.crawl
  )
})

const bulkActions = computed(() => {
  return memoizedGetBulkActions(props.selectedUrls.length)
})

const tableHeaders = computed(() => {
  return getTableHeaders()
})

// Methods
const hasUrlData = (url) => {
  return props.crawl?.aggregatedData?.[url] && props.crawl.aggregatedData[url].length > 0
}

const getRowActionsForUrl = (url) => {
  return memoizedGetRowActions(hasUrlData(url))
}
</script>
