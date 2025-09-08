<template>
  <!-- Modal Overlay -->
  <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="$emit('update:modelValue', false)"
      ></div>
      
      <!-- Modal Content -->
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Queue Status</h2>
              <p class="text-sm text-gray-500">Monitor and manage crawl queues</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="refreshQueues"
              :disabled="loading"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
            <button
              @click="$emit('update:modelValue', false)"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <!-- Summary Stats - Simplified -->
          <div v-if="summary" class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Queue Summary</h3>
              <div class="flex items-center space-x-4 text-sm">
                <span class="flex items-center space-x-1">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-gray-600">Active: {{ summary.totalActive }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span class="text-gray-600">Waiting: {{ summary.totalWaiting }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span class="text-gray-600">Failed: {{ summary.totalFailed }}</span>
                </span>
                <span class="flex items-center space-x-1">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-gray-600">Completed: {{ summary.totalCompleted }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-500">Loading queue status...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
            <p class="text-gray-500 mb-4">{{ error }}</p>
            <button
              @click="refreshQueues"
              :disabled="loading"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="!activeQueues || activeQueues.length === 0" class="text-center py-8">
            <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Active Queues</h3>
            <p class="text-gray-500">All crawl queues are currently empty.</p>
          </div>

          <!-- Queues List - Simplified -->
          <div v-else class="space-y-3">
            <div class="flex items-end justify-end mb-4">
              <button
                @click="clearAllQueues"
                :disabled="loading || !hasActiveQueues"
                class="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
            
            <div 
              v-for="queue in activeQueues" 
              :key="queue.crawlId"
              class="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 text-left">
                  <h4 class="font-medium text-gray-900">{{ queue.crawlTitle }}</h4>
                  <p class="text-xs text-gray-500">ID: {{ queue.crawlId }}</p>
                </div>
                <div class="flex items-center space-x-4 text-sm">
                  <span v-if="queue.active > 0" class="text-blue-600 font-medium">{{ queue.active }} active</span>
                  <span v-if="queue.waiting > 0" class="text-yellow-600 font-medium">{{ queue.waiting }} waiting</span>
                  <span v-if="queue.failed > 0" class="text-red-600 font-medium">{{ queue.failed }} failed</span>
                  <span v-if="queue.completed > 0" class="text-green-600 font-medium">{{ queue.completed }} completed</span>
                  <button
                    @click="clearQueue(queue.crawlId)"
                    :disabled="loading"
                    class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useApiService } from '../../composables/useApiService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// API service
const { get, del } = useApiService()

// State
const loading = ref(false)
const queues = ref([])
const summary = ref(null)
const error = ref(null)

// Inject notification function
const showNotification = inject('showNotification')

// Computed
const hasActiveQueues = computed(() => {
  if (!summary.value) return false
  return summary.value.totalActive > 0 || 
         summary.value.totalWaiting > 0 || 
         summary.value.totalDelayed > 0 || 
         summary.value.totalFailed > 0
})

const activeQueues = computed(() => {
  if (!queues.value) return []
  return queues.value.filter(queue => {
    // Show queues that have any non-completed jobs
    return queue.active > 0 || 
           queue.waiting > 0 || 
           queue.delayed > 0 || 
           queue.failed > 0
  })
})

// Methods
const fetchQueueStatus = async () => {
  // Prevent multiple simultaneous requests
  if (loading.value) {
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const data = await get('/api/allqueuesstatus')
    queues.value = data.queues || []
    summary.value = data.summary || {
      totalActive: 0,
      totalWaiting: 0,
      totalDelayed: 0,
      totalFailed: 0,
      totalCompleted: 0
    }
  } catch (err) {
    error.value = err.message
    console.error('Queue status fetch error:', err)
    
    // Show more specific error message
    if (err.message?.includes('max retries')) {
      showNotification('Redis connection failed. Please check if Redis is running.', 'error')
    } else {
      showNotification('Failed to fetch queue status', 'error')
    }
  } finally {
    loading.value = false
  }
}

const refreshQueues = async () => {
  await fetchQueueStatus()
}

const clearQueue = async (crawlId) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    const data = await del(`/api/clearqueue/${crawlId}`)
    showNotification(`Cleared ${data.clearedJobs} jobs from queue`, 'success')
    
    // Refresh the queue status
    await fetchQueueStatus()
  } catch (err) {
    console.error('Clear queue error:', err)
    if (err.message?.includes('max retries')) {
      showNotification('Redis connection failed. Please check if Redis is running.', 'error')
    } else {
      showNotification('Failed to clear queue', 'error')
    }
  } finally {
    loading.value = false
  }
}

const clearAllQueues = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    const data = await del('/api/clearallqueues')
    showNotification(`Cleared ${data.clearedQueues} queues with ${data.totalJobsCleared} total jobs`, 'success')
    
    // Refresh the queue status
    await fetchQueueStatus()
  } catch (err) {
    console.error('Clear all queues error:', err)
    if (err.message?.includes('max retries')) {
      showNotification('Redis connection failed. Please check if Redis is running.', 'error')
    } else {
      showNotification('Failed to clear all queues', 'error')
    }
  } finally {
    loading.value = false
  }
}

// Watch for modal opening to fetch data (no auto-refresh)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    fetchQueueStatus()
  }
})
</script>