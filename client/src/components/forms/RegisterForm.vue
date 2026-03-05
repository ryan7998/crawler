<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900">Sign Up</h2>
      <p class="text-sm text-gray-600 mt-2">Create your CrawlerPro account</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Name Fields -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <input
              v-model="formData.firstName"
              type="text"
              required
              class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="First name"
            />
          </div>
          <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">{{ errors.firstName }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <input
              v-model="formData.lastName"
              type="text"
              required
              class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Last name"
            />
          </div>
          <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">{{ errors.lastName }}</p>
        </div>
      </div>

      <!-- Email Field -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
            </svg>
          </div>
          <input
            v-model="formData.email"
            type="email"
            required
            class="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
        <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <!-- Password Field -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <input
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            required
            class="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a password"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg v-if="showPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
            </svg>
            <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
      </div>

      <!-- Confirm Password Field -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password *
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <input
            v-model="formData.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
            class="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg v-if="showConfirmPassword" class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
            </svg>
            <svg v-else class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span>{{ isLoading ? 'Creating Account...' : 'Create Account' }}</span>
      </button>
    </form>

    <!-- Switch to Login -->
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Already have an account? 
        <button
          @click="$emit('switch-to-login')"
          class="text-blue-600 hover:text-blue-700 font-medium"
        >
          Sign in here
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '../../composables/useAuth'

const emit = defineEmits(['switch-to-login', 'auth-success'])

const { register } = useAuth()

// Form data
const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// State
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password) => {
  return password.length >= 6
}

const validateName = (name) => {
  return name.trim().length >= 2
}

// Handle form submission
const handleRegister = async () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  errorMessage.value = ''

  // Validate form
  let isValid = true

  if (!formData.firstName) {
    errors.firstName = 'First name is required'
    isValid = false
  } else if (!validateName(formData.firstName)) {
    errors.firstName = 'First name must be at least 2 characters'
    isValid = false
  }

  if (!formData.lastName) {
    errors.lastName = 'Last name is required'
    isValid = false
  } else if (!validateName(formData.lastName)) {
    errors.lastName = 'Last name must be at least 2 characters'
    isValid = false
  }

  if (!formData.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }

  if (!formData.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  if (!isValid) return

  // Submit form
  isLoading.value = true
  try {
    await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    })
    emit('auth-success')
  } catch (error) {
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
