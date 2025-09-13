<template>
  <div class="lg:col-span-1 space-y-6">
    <!-- Latest Export Card -->
    <div v-if="latestExportLink" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Latest Export</h3>
        <div class="w-2 h-2 bg-green-400 rounded-full"></div>
      </div>
      <a
        :href="latestExportLink"
        target="_blank"
        class="inline-flex items-center w-full px-4 py-3 border border-green-200 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
      >
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        Open Google Sheet
      </a>
      <div class="text-sm text-gray-500 mt-3">
        Exported {{ formatDate(latestExportDate) }}
      </div>
    </div>

    <!-- Proxy Stats Widget -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <ProxyStatsWidget
        :stats="formattedCrawlStats"
        :detailed-stats="detailedProxyStats"
        :loading="proxyStatsLoading"
        :error="proxyStatsError"
        @refresh="$emit('refresh-proxy-stats')"
        @view-details="$emit('view-proxy-details')"
      />
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '../../../utils/formattingUtils'
import ProxyStatsWidget from '../../ui/stats/ProxyStatsWidget.vue'

// Props
defineProps({
  latestExportLink: {
    type: String,
    default: ''
  },
  latestExportDate: {
    type: Date,
    default: null
  },
  formattedCrawlStats: {
    type: Object,
    default: () => ({})
  },
  detailedProxyStats: {
    type: Object,
    default: () => ({})
  },
  proxyStatsLoading: {
    type: Boolean,
    default: false
  },
  proxyStatsError: {
    type: String,
    default: ''
  }
})

// Emits
defineEmits([
  'refresh-proxy-stats',
  'view-proxy-details'
])
</script>
