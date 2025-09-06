<template>
  <!-- Conditional rendering based on authentication status -->
  <LandingPage 
    v-if="!isAuthenticated" 
    @open-auth-modal="openAuthModal" 
  />
  <CrawlerDashboard 
    v-else 
    :key="`dashboard-${$route.params.crawlId || 'general'}`"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import LandingPage from './LandingPage.vue'
import CrawlerDashboard from './CrawlerDashboard.vue'

// Get authentication status
const { isAuthenticated } = useAuth()

// Define emits
const emit = defineEmits(['open-auth-modal'])

const openAuthModal = (mode) => {
  emit('open-auth-modal', mode)
}
</script>
