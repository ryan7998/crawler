<script setup>
import { ref } from 'vue'
import NotificationWrapper from './components/NotificationWrapper.vue'
import Navbar from './components/Navbar.vue'
import AuthModal from './components/AuthModal.vue'

// Auth modal state
const showAuthModal = ref(false)
const authModalMode = ref('login')

// Handle auth modal opening
const handleOpenAuthModal = (mode) => {
  authModalMode.value = mode
  showAuthModal.value = true
}
</script>

<template>
    <NotificationWrapper>
        <div class="min-h-screen bg-white w-full">
          <Navbar @open-auth-modal="handleOpenAuthModal" />
          <router-view @open-auth-modal="handleOpenAuthModal" />
          
          <!-- Auth Modal at app level -->
          <AuthModal
            v-model="showAuthModal"
            :initial-mode="authModalMode"
          />
        </div>
    </NotificationWrapper>
</template>

<style scoped>
/* Global styles for better performance */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
