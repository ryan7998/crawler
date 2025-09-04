<template>
  <v-card class="mx-auto" max-width="400" elevation="8">
    <v-card-title class="text-center pa-6">
      <h2 class="text-h4 font-weight-bold text-primary">Login</h2>
      <p class="text-body-2 text-medium-emphasis mt-2">Welcome back to Crawler</p>
    </v-card-title>

    <v-card-text class="pa-6">
      <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
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
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </v-btn>

        <div class="text-center">
          <p class="text-body-2">
            Don't have an account?
            <a 
              href="#" 
              @click.prevent="$emit('switch-to-register')"
              class="text-primary text-decoration-none"
            >
              Sign up here
            </a>
          </p>
        </div>
      </v-form>
    </v-card-text>

    <!-- Demo credentials info -->
    <v-card-text class="pa-6 pt-0">
      <v-alert
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <template v-slot:title>
          <span class="text-body-2 font-weight-bold">Demo Credentials</span>
        </template>
        <div class="text-body-2">
          <strong>Superadmin:</strong><br>
          Email: admin@crawler.com<br>
          Password: admin123456
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuth } from '../composables/useAuth'

// Emits
defineEmits(['switch-to-register'])

// Composables
const { login, loading, error, clearError } = useAuth()

// Form state
const form = ref(null)
const valid = ref(false)
const showPassword = ref(false)

const formData = reactive({
  email: '',
  password: ''
})

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => (v && v.length >= 6) || 'Password must be at least 6 characters'
]

// Methods
const handleLogin = async () => {
  if (!valid.value) return

  const result = await login(formData)
  
  if (!result.success) {
    // Error is already set in the store
    console.error('Login failed:', result.message)
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
