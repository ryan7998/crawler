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

    <!-- Proxy Stats Quick Access -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Proxy Analytics</h3>
        <div class="w-2 h-2 bg-cyan-400 rounded-full"></div>
      </div>
      <button
        @click="$emit('view-proxy-details')"
        class="inline-flex items-center w-full px-4 py-3 border border-cyan-200 text-sm font-medium rounded-lg text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors duration-200"
      >
        <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        View Proxy Details
      </button>
      <div class="text-sm text-gray-500 mt-3">
        Detailed proxy usage analytics and performance metrics
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '../../../utils/formattingUtils'

// Props
defineProps({
  latestExportLink: {
    type: String,
    default: ''
  },
  latestExportDate: {
    type: Date,
    default: null
  }
})

// Emits
defineEmits([
  'view-proxy-details'
])
</script>
