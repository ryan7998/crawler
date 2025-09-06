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
/* App-specific styles only */
</style>
