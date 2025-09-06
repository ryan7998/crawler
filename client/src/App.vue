<script setup>
import { computed } from 'vue'
import NotificationWrapper from './components/NotificationWrapper.vue'
import Navbar from './components/Navbar.vue'
import ModalWrapper from './components/ModalWrapper.vue'
import StatsWrapper from './components/StatsWrapper.vue'
import { useAuth } from './composables/useAuth'

// Get authentication status
const { isAuthenticated } = useAuth()

// Handle auth modal opening
const handleOpenAuthModal = (mode) => {
  window.openAuthModal(mode)
}
</script>

<template>
    <NotificationWrapper>
        <div class="min-h-screen bg-white w-full">
          <Navbar @open-auth-modal="handleOpenAuthModal" />
          
          <!-- Stats Wrapper for authenticated users only -->
          <StatsWrapper v-if="isAuthenticated">
            <router-view />
          </StatsWrapper>
          <router-view v-else />
          
          <!-- Global Modals Wrapper -->
          <ModalWrapper />
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
