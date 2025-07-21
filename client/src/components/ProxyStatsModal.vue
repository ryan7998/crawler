<template>
  <v-dialog v-model="isOpen" max-width="900px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-server-network" class="mr-2" />
          Proxy Usage Statistics
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" />
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate size="48" />
          <div class="mt-4">Loading proxy statistics...</div>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <v-icon icon="mdi-alert-circle" color="error" size="48" />
          <div class="mt-4 text-error">{{ error }}</div>
          <v-btn class="mt-4" @click="refreshData">Retry</v-btn>
        </div>

        <div v-else-if="!proxyStats || !proxyStats.summary" class="text-center py-8">
          <v-icon icon="mdi-server-off" size="48" color="grey" />
          <div class="mt-4 text-grey">No proxy usage data available</div>
        </div>

        <div v-else-if="proxyStats && proxyStats.summary">
          <!-- Summary Section -->
          <v-card class="mb-6" variant="outlined">
            <v-card-title class="text-h6">Summary</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-primary">
                      {{ formatNumber(proxyStats.summary.totalProxyRequests) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Total Requests</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">
                      {{ formatNumber(proxyStats.summary.uniqueProxiesUsed) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Unique Proxies</div>
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-info">
                      {{ formatPercentage(proxyStats.summary.averageProxySuccessRate) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">Success Rate</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Tabs for different views -->
          <v-tabs v-model="activeTab" class="mb-4">
            <v-tab value="performance">Proxy Performance</v-tab>
            <v-tab value="usage">Detailed Usage</v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Proxy Performance Tab -->
            <v-window-item value="performance">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Proxy Performance
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
                    :items="proxyStats.proxyPerformance || []"
                    :loading="loading"
                    class="elevation-0"
                  >
                    <template v-slot:item.proxyId="{ item }">
                      <div>
                        <div class="font-weight-medium">{{ item.proxyId }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.location }}</div>
                      </div>
                    </template>
                    <template v-slot:item.totalRequests="{ item }">
                      {{ formatNumber(item.totalRequests) }}
                    </template>
                    <template v-slot:item.successRate="{ item }">
                      <v-chip
                        :color="getSuccessRateColor(item.successRate)"
                        size="small"
                        variant="tonal"
                      >
                        {{ formatPercentage(item.successRate) }}
                      </v-chip>
                    </template>
                    <template v-slot:item.averageResponseTime="{ item }">
                      {{ formatResponseTime(item.averageResponseTime) }}
                    </template>
                    <template v-slot:item.lastUsed="{ item }">
                      {{ getRelativeTime(item.lastUsed) }}
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Detailed Usage Tab -->
            <v-window-item value="usage">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Detailed Usage
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
                    :items="proxyStats.detailedUsage || []"
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
                        <div class="font-weight-medium">{{ item.proxyId }}</div>
                        <div class="text-caption text-medium-emphasis">{{ item.proxyLocation }}</div>
                      </div>
                    </template>
                    <template v-slot:item.totalRequests="{ item }">
                      {{ formatNumber(item.totalRequests) }}
                    </template>
                    <template v-slot:item.successCount="{ item }">
                      <span class="text-success">{{ formatNumber(item.successCount) }}</span>
                    </template>
                    <template v-slot:item.failureCount="{ item }">
                      <span class="text-error">{{ formatNumber(item.failureCount) }}</span>
                    </template>
                    <template v-slot:item.lastUsed="{ item }">
                      {{ getRelativeTime(item.lastUsed) }}
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
import { ref, computed, watch } from 'vue'
import { useProxyStats } from '../composables/useProxyStats'

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
  costAnalysis,
  loading,
  error,
  fetchCrawlProxyStats,
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
  { title: 'Avg Response Time', key: 'averageResponseTime', sortable: true },
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
  { title: 'Total Cost', key: 'totalCost', sortable: true },
  { title: 'Total Requests', key: 'totalRequests', sortable: true },
  { title: 'Unique Proxies', key: 'uniqueProxies', sortable: true }
]

// Watch for modal open to load data
watch(isOpen, async (newValue) => {
  if (newValue && props.crawlId) {
    await loadData()
  }
})

const loadData = async () => {
  try {
    await fetchCrawlProxyStats(props.crawlId)
    await fetchCostAnalysis({
      crawlId: props.crawlId,
      startDate: costAnalysisParams.value.startDate,
      endDate: costAnalysisParams.value.endDate
    })
  } catch (err) {
    console.error('Error loading proxy stats:', err)
  }
}

const refreshData = async () => {
  await loadData()
}

const updateCostAnalysis = async () => {
  try {
    await fetchCostAnalysis({
      crawlId: props.crawlId,
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

// Helper functions
const getSuccessRateColor = (rate) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'error'
}

const formatResponseTime = (time) => {
  if (!time) return 'N/A'
  return `${time.toFixed(0)}ms`
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