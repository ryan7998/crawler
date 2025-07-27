<template>
  <v-dialog v-model="isOpen" max-width="900px" persistent @click:outside="closeModal">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-server-network" class="mr-2" />
          Global Proxy Usage Statistics
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" />
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate size="48" />
          <div class="mt-4">Loading global proxy statistics...</div>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <v-icon icon="mdi-alert-circle" color="error" size="48" />
          <div class="mt-4 text-error">{{ error }}</div>
          <v-btn class="mt-4" @click="refreshData">Retry</v-btn>
        </div>

        <div v-else-if="!globalStats || !globalStats.summary" class="text-center py-8">
          <v-icon icon="mdi-server-off" size="48" color="grey" />
          <div class="mt-4 text-grey">No global proxy usage data available</div>
          <v-btn class="mt-4" @click="refreshData">Refresh</v-btn>
        </div>

        <div v-else-if="globalStats && globalStats.summary">
          <!-- Summary Section -->
          <v-card class="mb-6" variant="outlined">
            <v-card-title class="text-h6">Global Summary</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ formatNumber(globalStats.summary.totalProxyRequests || 0) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Total Requests</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">
                      {{ formatNumber(globalStats.summary.uniqueProxiesUsed || 0) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Unique Proxies</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-info">
                      {{ formatPercentage(parseFloat(globalStats.summary.averageSuccessRate) || 0) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Success Rate</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Tabs for different views -->
          <v-tabs v-model="activeTab" class="mb-4">
            <v-tab value="performance">Top Proxies</v-tab>
            <v-tab value="usage">Recent Usage</v-tab>
            <v-tab value="costs">Cost Analysis</v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Top Proxies Tab -->
            <v-window-item value="performance">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Top Performing Proxies
                  <v-btn
                    icon="mdi-refresh"
                    size="small"
                    variant="text"
                    :loading="loading"
                    @click="refreshData"
                  />
                </v-card-title>
                <v-card-text>
                  <v-data-table
                    :headers="performanceHeaders"
                    :items="globalStats.topProxies || []"
                    :loading="loading"
                    class="elevation-0"
                  >
                    <template v-slot:item.proxyId="{ item }">
                      <div>
                        <div class="font-weight-medium">{{ item.proxyId || 'Unknown' }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.location || 'Unknown Location' }}</div>
                      </div>
                    </template>
                    <template v-slot:item.totalRequests="{ item }">
                      {{ formatNumber(item.totalRequests || 0) }}
                    </template>
                    <template v-slot:item.successRate="{ item }">
                      <v-chip
                        :color="getSuccessRateColor(item.successRate || 0)"
                        size="small"
                        variant="tonal"
                      >
                        {{ formatPercentage(item.successRate || 0) }}
                      </v-chip>
                    </template>
                    <template v-slot:item.lastUsed="{ item }">
                      {{ getRelativeTime(item.lastUsed) }}
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Recent Usage Tab -->
            <v-window-item value="usage">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Recent Proxy Usage
                  <v-btn
                    icon="mdi-refresh"
                    size="small"
                    variant="text"
                    :loading="loading"
                    @click="refreshData"
                  />
                </v-card-title>
                <v-card-text>
                  <v-data-table
                    :headers="usageHeaders"
                    :items="globalStats.recentUsage || []"
                    :loading="loading"
                    class="elevation-0"
                  >
                    <template v-slot:item.url="{ item }">
                      <div class="text-truncate" style="max-width: 200px;">
                        {{ item.url }}
                      </div>
                    </template>
                    <template v-slot:item.proxyId="{ item }">
                      <div>
                        <div class="font-weight-medium">{{ item.proxyId || 'Unknown' }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.proxyLocation || 'Unknown Location' }}</div>
                      </div>
                    </template>
                    <template v-slot:item.totalRequests="{ item }">
                      {{ formatNumber(item.totalRequests || 0) }}
                    </template>
                    <template v-slot:item.successCount="{ item }">
                      <span class="text-success">{{ formatNumber(item.successCount || 0) }}</span>
                    </template>
                    <template v-slot:item.failureCount="{ item }">
                      <span class="text-error">{{ formatNumber(item.failureCount || 0) }}</span>
                    </template>
                    <template v-slot:item.lastUsed="{ item }">
                      {{ getRelativeTime(item.lastUsed) }}
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Cost Analysis Tab -->
            <v-window-item value="costs">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Cost Analysis
                  <div class="d-flex gap-2">
                    <v-btn
                      icon="mdi-refresh"
                      size="small"
                      variant="text"
                      :loading="loading"
                      @click="refreshData"
                    />
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="warning"
                      @click="showCleanupDialog = true"
                    >
                      Cleanup Old Data
                    </v-btn>
                  </div>
                </v-card-title>
                <v-card-text>
                  <!-- Cost Summary -->
                  <div class="cost-summary">
                    <v-row>
                      <v-col cols="4">
                        <div class="text-center">
                          <div class="text-h5 font-weight-bold text-primary">
                            {{ formatNumber(costAnalysis.totalRequests || 0) }}
                          </div>
                          <div class="text-caption text-medium-emphasis">Total Requests</div>
                        </div>
                      </v-col>
                      <v-col cols="4">
                        <div class="text-center">
                          <div class="text-h5 font-weight-bold text-info">
                            {{ formatCost((costAnalysis.totalCost || 0) / Math.max(costAnalysis.totalRequests || 1, 1)) }}
                          </div>
                          <div class="text-caption text-medium-emphasis">Avg Cost/Request</div>
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <!-- Date Range Filter -->
                  <v-row class="mb-4">
                    <v-col cols="6">
                      <v-text-field
                        v-model="costAnalysisParams.startDate"
                        label="Start Date"
                        type="date"
                        variant="outlined"
                        density="compact"
                        @update:model-value="updateCostAnalysis"
                      />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="costAnalysisParams.endDate"
                        label="End Date"
                        type="date"
                        variant="outlined"
                        density="compact"
                        @update:model-value="updateCostAnalysis"
                      />
                    </v-col>
                  </v-row>

                  <!-- Daily Costs Table -->
                  <v-data-table
                    :headers="costHeaders"
                    :items="costAnalysis.dailyCosts || []"
                    :loading="loading"
                    class="elevation-0"
                  >
                    <template v-slot:item.date="{ item }">
                      {{ formatDate(item.date) }}
                    </template>
                    <template v-slot:item.totalRequests="{ item }">
                      {{ formatNumber(item.totalRequests || 0) }}
                    </template>
                    <template v-slot:item.uniqueProxies="{ item }">
                      {{ formatNumber(item.uniqueProxies || 0) }}
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" @click="closeModal">Close</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Cleanup Confirmation Dialog -->
    <v-dialog v-model="showCleanupDialog" max-width="400px">
      <v-card>
        <v-card-title>Cleanup Old Data</v-card-title>
        <v-card-text>
          <p>This will permanently delete proxy usage records older than the specified number of days.</p>
          <v-text-field
            v-model="cleanupDays"
            label="Days to keep"
            type="number"
            variant="outlined"
            density="compact"
            :rules="[v => v > 0 || 'Must be greater than 0']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showCleanupDialog = false">Cancel</v-btn>
          <v-btn
            color="warning"
            @click="performCleanup"
            :loading="loading"
          >
            Cleanup
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useProxyStats } from '../composables/useProxyStats'

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

// Table headers
const performanceHeaders = [
  { title: 'Proxy ID', key: 'proxyId', sortable: true },
  { title: 'Total Requests', key: 'totalRequests', sortable: true },
  { title: 'Success Rate', key: 'successRate', sortable: true },
  { title: 'Last Used', key: 'lastUsed', sortable: true }
]

const usageHeaders = [
  { title: 'URL', key: 'url', sortable: true },
  { title: 'Proxy', key: 'proxyId', sortable: true },
  { title: 'Total Requests', key: 'totalRequests', sortable: true },
  { title: 'Success', key: 'successCount', sortable: true },
  { title: 'Failures', key: 'failureCount', sortable: true },
  { title: 'Last Used', key: 'lastUsed', sortable: true }
]

const costHeaders = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Total Requests', key: 'totalRequests', sortable: true },
  { title: 'Unique Proxies', key: 'uniqueProxies', sortable: true }
]

// Watch for modal open to load data
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
    await loadData() // Refresh data after cleanup
  } catch (err) {
    console.error('Error performing cleanup:', err)
  }
}

const closeModal = () => {
  isOpen.value = false
}

// Add escape key handler
const handleEscape = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

// Add event listener when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscape)
    loadData()
  } else {
    document.removeEventListener('keydown', handleEscape)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

// Helper functions
const getSuccessRateColor = (rate) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'error'
}
</script>

<style scoped>
.cost-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
</style> 