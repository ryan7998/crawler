<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import NotificationWrapper from './components/layout/NotificationWrapper.vue'
import Navbar from './components/layout/Navbar.vue'
import ModalWrapper from './components/layout/ModalWrapper.vue'
import StatsWrapper from './components/layout/StatsWrapper.vue'
import { useAuth } from './composables/useAuth'

// Get authentication status and router
const { isAuthenticated } = useAuth()
const router = useRouter()

// Handle auth modal opening
const handleOpenAuthModal = (mode) => {
  window.openAuthModal(mode)
}

// Watch for auth state changes and redirect if user becomes unauthenticated
watch(isAuthenticated, (isAuth, wasAuth) => {
  // If user was authenticated but is no longer, redirect to home
  if (wasAuth && !isAuth && router.currentRoute.value.meta.requiresAuth) {
    router.push('/')
  }
})
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
