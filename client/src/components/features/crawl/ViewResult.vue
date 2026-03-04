<template>
  <div class="space-y-4">
    <!-- URL context pill -->
    <div v-if="props.url" class="flex items-center space-x-2 text-sm text-gray-500">
      <svg class="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
      <span class="truncate font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{{ props.url }}</span>
    </div>

    <!-- Error state -->
    <div
      v-if="typeof props.data === 'string'"
      class="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <svg class="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-sm text-red-700">{{ props.data }}</p>
    </div>

    <!-- History table -->
    <template v-else-if="tableData.length">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <!-- Card header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900">Crawl History</h3>
              <p class="text-sm text-gray-500 mt-0.5">{{ tableData.length }} {{ tableData.length === 1 ? 'entry' : 'entries' }}</p>
            </div>
            <div class="flex items-center space-x-1.5">
              <span
                v-if="successCount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >
                {{ successCount }} success
              </span>
              <span
                v-if="errorCount > 0"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
              >
                {{ errorCount }} failed
              </span>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th v-if="hasErrors" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Error</th>
                <th
                  v-for="key in allKeys"
                  :key="key"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {{ formatKey(key) }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="row in tableData"
                :key="row.date"
                class="hover:bg-gray-50 transition-colors duration-150"
              >
                <!-- Date -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ formatDate(row.date) }}
                </td>

                <!-- Status badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      row.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    ]"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full mr-1.5',
                        row.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      ]"
                    ></span>
                    {{ row.status }}
                  </span>
                </td>

                <!-- Error column (only when any row has an error) -->
                <td v-if="hasErrors" class="px-6 py-4 text-sm">
                  <div
                    v-if="row.error"
                    class="flex items-start space-x-1.5 text-red-600 max-w-xs"
                  >
                    <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="break-words">{{ row.error }}</span>
                  </div>
                  <span v-else class="text-gray-300">—</span>
                </td>

                <!-- Dynamic data columns -->
                <td v-for="key in allKeys" :key="key" class="px-6 py-4 text-sm text-gray-700">
                  <template v-if="Array.isArray(row.data[key])">
                    <ul class="space-y-1">
                      <li
                        v-for="(item, index) in row.data[key]"
                        :key="index"
                        class="flex items-start space-x-1.5"
                      >
                        <span class="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0 mt-2"></span>
                        <span class="break-words">{{ item }}</span>
                      </li>
                    </ul>
                  </template>
                  <template v-else>
                    <span v-if="row.data[key] !== undefined && row.data[key] !== null" class="break-words">{{ row.data[key] }}</span>
                    <span v-else class="text-gray-300">—</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-900">No crawl data available</p>
      <p class="text-sm text-gray-500 mt-1">This URL has not been crawled yet.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDate } from '../../../utils/formattingUtils'

const props = defineProps({
  data: {
    default: null
  },
  url: {
    type: String,
    default: ''
  }
})

const formatKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const hasErrors = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return false
  return props.data.some(item => item.error)
})

const allKeys = computed(() => {
  if (!props.data || typeof props.data === 'string' || !Array.isArray(props.data)) return []
  const keys = new Set()
  props.data.forEach(item => {
    if (item?.data && typeof item.data === 'object') {
      Object.keys(item.data).forEach(key => keys.add(key))
    }
  })
  return Array.from(keys)
})

const tableData = computed(() => {
  if (!props.data || typeof props.data === 'string' || !Array.isArray(props.data)) return []
  return props.data.map(item => ({
    date: item.date,
    status: item.status,
    error: item.error,
    data: item.data || {}
  }))
})

const successCount = computed(() => tableData.value.filter(r => r.status === 'success').length)
const errorCount = computed(() => tableData.value.filter(r => r.status !== 'success').length)
</script>
