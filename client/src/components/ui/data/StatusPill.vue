<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusClasses
    ]"
  >
    <span
      v-if="showDot"
      :class="[
        'w-1.5 h-1.5 rounded-full mr-1.5',
        dotClasses
      ]"
    ></span>
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  showDot: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value)
  }
})

const statusConfig = {
  'running': {
    classes: 'bg-blue-100 text-blue-800',
    dotClasses: 'bg-blue-400'
  },
  'in-progress': {
    classes: 'bg-blue-100 text-blue-800',
    dotClasses: 'bg-blue-400'
  },
  'completed': {
    classes: 'bg-green-100 text-green-800',
    dotClasses: 'bg-green-400'
  },
  'success': {
    classes: 'bg-green-100 text-green-800',
    dotClasses: 'bg-green-400'
  },
  'failed': {
    classes: 'bg-red-100 text-red-800',
    dotClasses: 'bg-red-400'
  },
  'error': {
    classes: 'bg-red-100 text-red-800',
    dotClasses: 'bg-red-400'
  },
  'pending': {
    classes: 'bg-yellow-100 text-yellow-800',
    dotClasses: 'bg-yellow-400'
  },
  'waiting': {
    classes: 'bg-yellow-100 text-yellow-800',
    dotClasses: 'bg-yellow-400'
  },
  'cancelled': {
    classes: 'bg-gray-100 text-gray-800',
    dotClasses: 'bg-gray-400'
  },
  'stopped': {
    classes: 'bg-gray-100 text-gray-800',
    dotClasses: 'bg-gray-400'
  },
  'loading': {
    classes: 'bg-gray-100 text-gray-800',
    dotClasses: 'bg-gray-400'
  }
}

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-sm'
}

const statusClasses = computed(() => {
  const config = statusConfig[props.status?.toLowerCase()] || statusConfig['pending']
  const sizeClass = sizeClasses[props.size]
  return `${config.classes} ${sizeClass}`
})

const dotClasses = computed(() => {
  const config = statusConfig[props.status?.toLowerCase()] || statusConfig['pending']
  return config.dotClasses
})

const displayText = computed(() => {
  if (!props.status) return 'Unknown'
  return props.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
})
</script>
