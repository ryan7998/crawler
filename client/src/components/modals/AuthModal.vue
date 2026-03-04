<template>
  <!-- Modal Overlay -->
  <div v-if="isOpen" class="fixed inset-0 z-[9999] overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[9998]"
      @click="closeModal"
    ></div>
    
    <!-- Modal Content -->
    <div class="relative flex min-h-screen items-center justify-center p-4 z-[9999]">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ mode === 'login' ? 'Welcome Back' : 'Create Account' }}
          </h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Login Form -->
          <LoginForm
            v-if="mode === 'login'"
            @switch-to-register="mode = 'register'"
            @auth-success="handleAuthSuccess"
          />

          <!-- Register Form -->
          <RegisterForm
            v-if="mode === 'register'"
            @switch-to-login="mode = 'login'"
            @auth-success="handleAuthSuccess"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import LoginForm from '../forms/LoginForm.vue'
import RegisterForm from '../forms/RegisterForm.vue'

const router = useRouter()
import { useAuth } from '../../composables/useAuth'

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

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const mode = ref(props.initialMode)

// Watch for prop changes
watch(() => props.initialMode, (newMode) => {
  mode.value = newMode
})

// Methods
const closeModal = () => {
  isOpen.value = false
}

// Close modal on escape key
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

// Handle successful authentication
const handleAuthSuccess = () => {
  closeModal()
  // Redirect to dashboard after successful login/registration
  router.push('/')
}

// Add event listener when component mounts
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// Remove event listener when component unmounts
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
