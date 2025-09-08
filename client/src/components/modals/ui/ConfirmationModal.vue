<template>
  <!-- Modal Overlay -->
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      @click="handleCancel"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative flex min-h-screen items-center justify-center p-4">
      <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
        <!-- Header -->
        <div class="flex items-center p-6 border-b border-gray-200">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="iconColorClass">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6">
          <p class="text-gray-700 mb-4">{{ message }}</p>
          
          <!-- Details Section -->
          <div v-if="details" class="mb-4">
            <p class="text-sm font-medium text-gray-500 mb-2">{{ detailsLabel || 'Details:' }}</p>
            <div class="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
              <slot name="details">
                <p class="text-sm text-gray-600 break-all">{{ details }}</p>
              </slot>
            </div>
          </div>
          
          <!-- Items Section -->
          <div v-if="items && items.length > 0" class="mb-4">
            <p class="text-sm font-medium text-gray-500 mb-2">{{ itemsLabel || 'Items:' }}</p>
            <div class="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
              <ul class="text-sm text-gray-600">
                <li v-for="item in items" :key="item" class="break-all py-1">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            @click="handleCancel"
            :disabled="loading"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="loading"
            :class="confirmButtonClass"
            class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span>{{ confirmText }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  detailsLabel: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  itemsLabel: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  color: {
    type: String,
    default: 'primary'
  },
  icon: {
    type: String,
    default: 'mdi-alert-circle'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Computed properties for styling
const iconColorClass = computed(() => {
  switch (props.color) {
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'success':
      return 'bg-green-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.color) {
    case 'error':
      return 'bg-red-600 text-white hover:bg-red-700'
    case 'warning':
      return 'bg-yellow-600 text-white hover:bg-yellow-700'
    case 'success':
      return 'bg-green-600 text-white hover:bg-green-700'
    case 'info':
      return 'bg-blue-600 text-white hover:bg-blue-700'
    default:
      return 'bg-gray-600 text-white hover:bg-gray-700'
  }
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  show.value = false
}
</script> 