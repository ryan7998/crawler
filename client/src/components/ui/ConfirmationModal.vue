<template>
  <v-dialog v-model="show" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h6">
        <v-icon :icon="icon" :color="color" class="mr-2" />
        {{ title }}
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-1">{{ message }}</p>
        <div v-if="details" class="mt-3">
          <p class="text-caption text-grey">{{ detailsLabel || 'Details:' }}</p>
          <div class="max-h-32 overflow-y-auto mt-1">
            <slot name="details">
              <p class="text-sm text-grey-darken-1 break-all">{{ details }}</p>
            </slot>
          </div>
        </div>
        <div v-if="items && items.length > 0" class="mt-3">
          <p class="text-caption text-grey">{{ itemsLabel || 'Items:' }}</p>
          <div class="max-h-32 overflow-y-auto mt-1">
            <ul class="text-xs text-grey-500">
              <li v-for="item in items" :key="item" class="break-all">{{ item }}</li>
            </ul>
          </div>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          color="grey"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="color"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  show.value = false
}
</script> 