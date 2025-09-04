<template>
  <v-card class="mx-auto" max-width="400" elevation="8">
    <v-card-title class="text-center pa-6">
      <h2 class="text-h4 font-weight-bold text-primary">Sign Up</h2>
      <p class="text-body-2 text-medium-emphasis mt-2">Create your Crawler account</p>
    </v-card-title>

    <v-card-text class="pa-6">
      <v-form ref="form" v-model="valid" @submit.prevent="handleRegister">
        <v-text-field
          v-model="formData.firstName"
          label="First Name"
          :rules="nameRules"
          required
          prepend-inner-icon="mdi-account"
          variant="outlined"
          class="mb-4"
        />

        <v-text-field
          v-model="formData.lastName"
          label="Last Name"
          :rules="nameRules"
          required
          prepend-inner-icon="mdi-account"
          variant="outlined"
          class="mb-4"
        />

        <v-text-field
          v-model="formData.email"
          label="Email"
          type="email"
          :rules="emailRules"
          required
          prepend-inner-icon="mdi-email"
          variant="outlined"
          class="mb-4"
        />

        <v-text-field
          v-model="formData.password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          :rules="passwordRules"
          required
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          class="mb-4"
        />

        <v-text-field
          v-model="formData.confirmPassword"
          label="Confirm Password"
          :type="showConfirmPassword ? 'text' : 'password'"
          :rules="confirmPasswordRules"
          required
          prepend-inner-icon="mdi-lock-check"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          variant="outlined"
          class="mb-4"
        />

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="clearError"
        >
          {{ error }}
        </v-alert>

        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="loading"
          :disabled="!valid || loading"
          class="mb-4"
        >
          {{ loading ? 'Creating Account...' : 'Create Account' }}
        </v-btn>

        <div class="text-center">
          <p class="text-body-2">
            Already have an account?
            <a 
              href="#" 
              @click.prevent="$emit('switch-to-login')"
              class="text-primary text-decoration-none"
            >
              Sign in here
            </a>
          </p>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuth } from '../composables/useAuth'

// Emits
const emit = defineEmits(['switch-to-login', 'auth-success'])

// Composables
const { register, loading, error, clearError } = useAuth()

// Form state
const form = ref(null)
const valid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Validation rules
const nameRules = [
  v => !!v || 'Name is required',
  v => (v && v.length >= 2) || 'Name must be at least 2 characters',
  v => (v && v.length <= 50) || 'Name cannot exceed 50 characters'
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => (v && v.length >= 6) || 'Password must be at least 6 characters'
]

const confirmPasswordRules = computed(() => [
  v => !!v || 'Please confirm your password',
  v => v === formData.password || 'Passwords do not match'
])

// Methods
const handleRegister = async () => {
  if (!valid.value) return

  const result = await register(formData)
  
  if (result.success) {
    // Emit success event to close modal
    emit('auth-success')
  } else {
    // Error is already set in the store
    console.error('Registration failed:', result.message)
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-btn {
  text-transform: none;
  font-weight: 600;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
