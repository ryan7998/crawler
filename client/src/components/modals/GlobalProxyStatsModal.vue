<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="closeModal"
    ></div>

    <!-- Modal -->
    <div class="relative flex min-h-screen items-center justify-center p-4">
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Global Proxy Usage Statistics</h2>
          </div>
          <button @click="closeModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto p-6">

          <!-- Loading -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-16">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-sm text-gray-500">Loading global proxy statistics...</p>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex flex-col items-center justify-center py-16">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-sm text-red-600 mb-4">{{ error }}</p>
            <button @click="refreshData" class="px-4 py-2 bg-white border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Retry</button>
          </div>

          <!-- No data -->
          <div v-else-if="!globalStats || !globalStats.summary" class="flex flex-col items-center justify-center py-16">
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
              </svg>
            </div>
            <p class="text-sm text-gray-500 mb-4">No global proxy usage data available</p>
            <button @click="refreshData" class="px-4 py-2 bg-white border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Refresh</button>
          </div>

          <!-- Data -->
          <div v-else>
            <!-- Summary Cards -->
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ formatNumber(globalStats.summary.totalProxyRequests || 0) }}</div>
                <div class="text-xs text-gray-500 mt-1">Total Requests</div>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div class="text-2xl font-bold text-green-600">{{ formatNumber(globalStats.summary.uniqueProxiesUsed || 0) }}</div>
                <div class="text-xs text-gray-500 mt-1">Unique Proxies</div>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div class="text-2xl font-bold text-indigo-600">{{ formatPercentage(parseFloat(globalStats.summary.averageSuccessRate) || 0) }}</div>
                <div class="text-xs text-gray-500 mt-1">Success Rate</div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200 mb-4">
              <nav class="flex space-x-6">
                <button
                  v-for="tab in tabs"
                  :key="tab.value"
                  @click="activeTab = tab.value"
                  :class="[
                    'pb-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.value
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  ]"
                >
                  {{ tab.label }}
                </button>
              </nav>
            </div>

            <!-- Top Proxies Tab -->
            <div v-if="activeTab === 'performance'" class="bg-white rounded-xl border border-gray-200">
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900">Top Performing Proxies</h3>
                <button @click="refreshData" :disabled="loading" class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                  <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy ID</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Requests</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="!globalStats.topProxies || globalStats.topProxies.length === 0">
                      <td colspan="4" class="px-4 py-8 text-center text-sm text-gray-400">No data</td>
                    </tr>
                    <tr v-for="item in (globalStats.topProxies || [])" :key="item.proxyId" class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3">
                        <div class="text-sm font-medium text-gray-900">{{ item.proxyId || 'Unknown' }}</div>
                        <div class="text-xs text-gray-500">{{ item.location || 'Unknown Location' }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(item.totalRequests || 0) }}</td>
                      <td class="px-4 py-3">
                        <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getSuccessRateBadgeClass(item.successRate || 0)]">
                          {{ formatPercentage(item.successRate || 0) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-500">{{ getRelativeTime(item.lastUsed) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Recent Usage Tab -->
            <div v-if="activeTab === 'usage'" class="bg-white rounded-xl border border-gray-200">
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900">Recent Proxy Usage</h3>
                <button @click="refreshData" :disabled="loading" class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                  <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proxy</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failures</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="!globalStats.recentUsage || globalStats.recentUsage.length === 0">
                      <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">No data</td>
                    </tr>
                    <tr v-for="item in (globalStats.recentUsage || [])" :key="item.url + item.proxyId" class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3 max-w-[200px]">
                        <div class="text-sm text-gray-700 truncate">{{ item.url }}</div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm font-medium text-gray-900">{{ item.proxyId || 'Unknown' }}</div>
                        <div class="text-xs text-gray-500">{{ item.proxyLocation || 'Unknown Location' }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(item.totalRequests || 0) }}</td>
                      <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ formatNumber(item.successCount || 0) }}</td>
                      <td class="px-4 py-3 text-sm text-red-600 font-medium">{{ formatNumber(item.failureCount || 0) }}</td>
                      <td class="px-4 py-3 text-sm text-gray-500">{{ getRelativeTime(item.lastUsed) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Cost Analysis Tab -->
            <div v-if="activeTab === 'costs'" class="space-y-4">
              <div class="bg-white rounded-xl border border-gray-200">
                <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 class="text-sm font-semibold text-gray-900">Cost Analysis</h3>
                  <div class="flex items-center space-x-2">
                    <button @click="refreshData" :disabled="loading" class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                      <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </button>
                    <button
                      @click="showCleanupDialog = true"
                      class="px-3 py-1.5 text-sm font-medium border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      Cleanup Old Data
                    </button>
                  </div>
                </div>

                <!-- Cost summary -->
                <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-200">
                  <div class="text-center">
                    <div class="text-xl font-bold text-blue-600">{{ formatNumber(costAnalysis.totalRequests || 0) }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">Total Requests</div>
                  </div>
                  <div class="text-center">
                    <div class="text-xl font-bold text-indigo-600">{{ formatCost((costAnalysis.totalCost || 0) / Math.max(costAnalysis.totalRequests || 1, 1)) }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">Avg Cost / Request</div>
                  </div>
                </div>

                <!-- Date range filter -->
                <div class="grid grid-cols-2 gap-4 p-4 border-b border-gray-200">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input
                      v-model="costAnalysisParams.startDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      @change="updateCostAnalysis"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      v-model="costAnalysisParams.endDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      @change="updateCostAnalysis"
                    />
                  </div>
                </div>

                <!-- Daily costs table -->
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Requests</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Proxies</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-if="!costAnalysis.dailyCosts || costAnalysis.dailyCosts.length === 0">
                        <td colspan="3" class="px-4 py-8 text-center text-sm text-gray-400">No data</td>
                      </tr>
                      <tr v-for="item in (costAnalysis.dailyCosts || [])" :key="item.date" class="hover:bg-gray-50 transition-colors">
                        <td class="px-4 py-3 text-sm text-gray-700">{{ formatDate(item.date) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(item.totalRequests || 0) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-700">{{ formatNumber(item.uniqueProxies || 0) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Cleanup Confirmation Dialog -->
    <div v-if="showCleanupDialog" class="fixed inset-0 z-[60] overflow-y-auto">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showCleanupDialog = false"></div>
      <div class="relative flex min-h-screen items-center justify-center p-4">
        <div class="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-2">Cleanup Old Data</h3>
          <p class="text-sm text-gray-600 mb-4">This will permanently delete proxy usage records older than the specified number of days.</p>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Days to keep</label>
            <input
              v-model.number="cleanupDays"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="flex justify-end space-x-3">
            <button
              @click="showCleanupDialog = false"
              class="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="performCleanup"
              :disabled="loading"
              class="px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <span>Cleanup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useProxyStats } from '../../composables/useProxyStats'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const {
  globalStats,
  costAnalysis,
  loading,
  error,
  fetchGlobalProxyStats,
  fetchCostAnalysis,
  cleanupProxyUsage,
  formatNumber,
  formatCost,
  formatPercentage,
  formatDate,
  getRelativeTime
} = useProxyStats()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('performance')
const showCleanupDialog = ref(false)
const cleanupDays = ref(90)
const costAnalysisParams = ref({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
})

const tabs = [
  { value: 'performance', label: 'Top Proxies' },
  { value: 'usage', label: 'Recent Usage' },
  { value: 'costs', label: 'Cost Analysis' }
]

const loadData = async () => {
  try {
    await fetchGlobalProxyStats()
    await fetchCostAnalysis({
      startDate: costAnalysisParams.value.startDate,
      endDate: costAnalysisParams.value.endDate
    })
  } catch (err) {
    console.error('Error loading global proxy stats:', err)
  }
}

const refreshData = async () => {
  await loadData()
}

const updateCostAnalysis = async () => {
  try {
    await fetchCostAnalysis({
      startDate: costAnalysisParams.value.startDate,
      endDate: costAnalysisParams.value.endDate
    })
  } catch (err) {
    console.error('Error fetching cost analysis:', err)
  }
}

const performCleanup = async () => {
  try {
    await cleanupProxyUsage(cleanupDays.value)
    showCleanupDialog.value = false
    await loadData()
  } catch (err) {
    console.error('Error performing cleanup:', err)
  }
}

const closeModal = () => {
  isOpen.value = false
}

const handleEscape = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscape)
    loadData()
  } else {
    document.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Returns Tailwind badge classes based on success rate
const getSuccessRateBadgeClass = (rate) => {
  if (rate >= 90) return 'bg-green-100 text-green-700'
  if (rate >= 70) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}
</script>
