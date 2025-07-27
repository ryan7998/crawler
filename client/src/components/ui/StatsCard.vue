<template>
  <div class="stats-card">
    <div class="stats-card__content">
      <div class="stats-card__value" :class="valueClass">
        {{ formattedValue }}
      </div>
      <div class="stats-card__label" :class="labelClass">
        {{ label }}
      </div>
      <div v-if="subtitle" class="stats-card__subtitle" :class="subtitleClass">
        {{ subtitle }}
      </div>
    </div>
    <div v-if="$slots.icon" class="stats-card__icon">
      <slot name="icon" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFormatting } from '@/composables/useFormatting'

const props = defineProps({
  value: {
    type: [Number, String],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'number', // 'number', 'currency', 'percentage', 'text'
    validator: (value) => ['number', 'currency', 'percentage', 'text'].includes(value)
  },
  color: {
    type: String,
    default: 'primary', // Vuetify color names
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  formatOptions: {
    type: Object,
    default: () => ({})
  }
})

const { formatNumber, formatCost, formatPercentage } = useFormatting()

const formattedValue = computed(() => {
  switch (props.type) {
    case 'currency':
      return formatCost(props.value, props.formatOptions.currency, props.formatOptions.minimumFractionDigits)
    case 'percentage':
      return formatPercentage(props.value, props.formatOptions.decimalPlaces)
    case 'number':
      return formatNumber(props.value, props.formatOptions)
    default:
      return props.value
  }
})

const valueClass = computed(() => [
  `text-${props.color}`,
  `stats-card__value--${props.size}`
])

const labelClass = computed(() => [
  'text-medium-emphasis',
  `stats-card__label--${props.size}`
])

const subtitleClass = computed(() => [
  'text-caption',
  'text-medium-emphasis',
  `stats-card__subtitle--${props.size}`
])
</script>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.stats-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stats-card__content {
  flex: 1;
  text-align: center;
}

.stats-card__value {
  font-weight: bold;
  line-height: 1.2;
}

.stats-card__value--small {
  font-size: 1.5rem;
}

.stats-card__value--medium {
  font-size: 2rem;
}

.stats-card__value--large {
  font-size: 2.5rem;
}

.stats-card__label {
  margin-top: 4px;
  line-height: 1.2;
}

.stats-card__label--small {
  font-size: 0.875rem;
}

.stats-card__label--medium {
  font-size: 1rem;
}

.stats-card__label--large {
  font-size: 1.125rem;
}

.stats-card__subtitle {
  margin-top: 2px;
  line-height: 1.2;
}

.stats-card__subtitle--small {
  font-size: 0.75rem;
}

.stats-card__subtitle--medium {
  font-size: 0.875rem;
}

.stats-card__subtitle--large {
  font-size: 1rem;
}

.stats-card__icon {
  margin-left: 16px;
  opacity: 0.7;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .stats-card {
    padding: 12px;
  }
  
  .stats-card__value--large {
    font-size: 2rem;
  }
  
  .stats-card__value--medium {
    font-size: 1.75rem;
  }
  
  .stats-card__value--small {
    font-size: 1.25rem;
  }
}
</style> 