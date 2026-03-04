<template>
  <!-- Main Modal -->
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="closeModal">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <!-- Modern Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">Proxy Usage Statistics</h2>
                <p class="text-blue-100 text-sm">Detailed proxy performance and usage analytics</p>
              </div>
            </div>
            <button
              @click="closeModal"
              class="rounded-lg p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-600">Loading proxy statistics...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900">Error Loading Data</h3>
            <p class="mt-2 text-sm text-gray-600">{{ error }}</p>
            <button
              @click="refreshData"
              class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="!proxyStats || !proxyStats.summary" class="flex flex-col items-center justify-center py-12">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
            <h3 class="mt-4 text-lg font-semibold text-gray-900">No Data Available</h3>
            <p class="mt-2 text-sm text-gray-600">No proxy usage data available for this crawl</p>
          </div>


          <!-- Data Content -->
          <div v-if="proxyStats && proxyStats.summary">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                      <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-blue-600">Total Requests</p>
                    <p class="text-2xl font-bold text-blue-900">{{ formatNumber(proxyStats.summary.totalProxyRequests) }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                      <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-green-600">Unique Proxies</p>
                    <p class="text-2xl font-bold text-green-900">{{ formatNumber(proxyStats.summary.uniqueProxiesUsed) }}</p>
                  </div>
                </div>
              </div>

              <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
                      <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-purple-600">Success Rate</p>
                    <p class="text-2xl font-bold text-purple-900">{{ formatPercentage(proxyStats.summary.averageSuccessRate) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200 mb-6">
              <nav class="-mb-px flex space-x-8">
                <button
                  @click="activeTab = 'performance'"
                  :class="[
                    activeTab === 'performance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors'
                  ]"
                >
                  Proxy Performance
                </button>
                <button
                  @click="activeTab = 'usage'"
                  :class="[
                    activeTab === 'usage'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors'
                  ]"
                >
                  Detailed Usage
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
              <!-- Performance Tab -->
              <div v-if="activeTab === 'performance'" class="p-6">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-semibold text-gray-900">Proxy Performance</h3>
                  <button
                    @click="refreshData"
                    :disabled="loading"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>

                <!-- Performance Table -->
                <div class="overflow-hidden">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Requests</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="item in proxyStats.proxyPerformance || []" :key="item.proxyId" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ item.proxyId }}</div>
                            <div class="text-sm text-gray-500">{{ item.location }}</div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ formatNumber(item.totalRequests) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span :class="getSuccessRateClasses(item.successRate)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                            {{ formatPercentage(item.successRate) }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ formatResponseTime(item.averageResponseTime) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ getRelativeTime(item.lastUsed) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Usage Tab -->
              <div v-if="activeTab === 'usage'" class="p-6">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-semibold text-gray-900">Detailed Usage</h3>
                  <button
                    @click="refreshData"
                    :disabled="loading"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>

                <!-- Usage Table -->
                <div class="overflow-hidden">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Requests</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failures</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="item in proxyStats.detailedUsage || []" :key="`${item.url}-${item.proxyId}`" class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                          <div class="text-sm text-gray-900 max-w-xs truncate" :title="item.url">
                            {{ item.url }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div class="text-sm font-medium text-gray-900">{{ item.proxyId }}</div>
                            <div class="text-sm text-gray-500">{{ item.proxyLocation }}</div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ formatNumber(item.totalRequests) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {{ formatNumber(item.successCount) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {{ formatNumber(item.failureCount) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ getRelativeTime(item.lastUsed) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            @click="showCleanupDialog = true"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Cleanup Data
          </button>
          <button
            @click="closeModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Cleanup Confirmation Modal -->
  <div v-if="showCleanupDialog" class="fixed inset-0 z-60 overflow-y-auto" @click.self="showCleanupDialog = false">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Cleanup Old Data</h3>
        </div>
        <div class="px-6 py-4">
          <p class="text-sm text-gray-600 mb-4">This will permanently delete proxy usage records older than the specified number of days.</p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Days to keep</label>
            <input
              v-model.number="cleanupDays"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="90"
            />
            <p v-if="cleanupDays <= 0" class="mt-1 text-sm text-red-600">Must be greater than 0</p>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            @click="showCleanupDialog = false"
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            @click="performCleanup"
            :disabled="cleanupDays <= 0 || loading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cleanup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProxyStats } from '../../composables/useProxyStats'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  crawlId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const {
  proxyStats,
  loading,
  error,
  fetchCrawlProxyStats,
  cleanupProxyUsage,
  formatNumber,
  formatPercentage,
  getRelativeTime
} = useProxyStats()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('performance')
const showCleanupDialog = ref(false)
const cleanupDays = ref(90)

// Define loadData function first
const loadData = async () => {
  try {
    await fetchCrawlProxyStats(props.crawlId)
  } catch (err) {
    console.error('Error loading proxy stats:', err)
  }
}

// Watch for crawlId changes
watch(() => props.crawlId, async (newCrawlId, oldCrawlId) => {
  if (newCrawlId && newCrawlId !== oldCrawlId) {
    await loadData()
  }
}, { immediate: true })

// Watch for modal open to load data
watch(isOpen, async (newValue) => {
  if (newValue && props.crawlId) {
    await loadData()
  }
})

const refreshData = async () => {
  await loadData()
}


const performCleanup = async () => {
  try {
    await cleanupProxyUsage(cleanupDays.value)
    showCleanupDialog.value = false
    await loadData() // Refresh data after cleanup
  } catch (err) {
    console.error('Error performing cleanup:', err)
  }
}

const closeModal = () => {
  isOpen.value = false
}

// Helper functions
const getSuccessRateClasses = (rate) => {
  if (rate >= 90) return 'bg-green-100 text-green-800'
  if (rate >= 70) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

const formatResponseTime = (time) => {
  if (!time) return 'N/A'
  return `${time.toFixed(0)}ms`
}
</script>
