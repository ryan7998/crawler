<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeModal"
        />
      </v-card-actions>

      <v-card-text class="pa-0">
        <!-- Login Form -->
        <LoginForm
          v-if="mode === 'login'"
          @switch-to-register="mode = 'register'"
          @auth-success="closeModal"
        />

        <!-- Register Form -->
        <RegisterForm
          v-if="mode === 'register'"
          @switch-to-login="mode = 'login'"
          @auth-success="closeModal"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import { useAuth } from '../composables/useAuth'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'login',
    validator: (value) => ['login', 'register'].includes(value)
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Composables
const { isAuthenticated } = useAuth()

// State
const isOpen = ref(props.modelValue)
const mode = ref(props.initialMode)

// Watchers
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
})

watch(() => props.initialMode, (newValue) => {
  mode.value = newValue
})

// Close modal when user becomes authenticated
watch(isAuthenticated, (newValue) => {
  if (newValue && isOpen.value) {
    closeModal()
  }
})

// Methods
const closeModal = () => {
  isOpen.value = false
  emit('update:modelValue', false)
}
</script>

<style scoped>
.v-dialog .v-card {
  border-radius: 12px;
}
</style>
