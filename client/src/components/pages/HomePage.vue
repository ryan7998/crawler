<template>
  <!-- Conditional rendering based on authentication status -->
  <LandingPage v-if="!isAuthenticated" />
  <GeneralDashboard v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import LandingPage from './LandingPage.vue'
import GeneralDashboard from './GeneralDashboard.vue'

// Get authentication status
const { isAuthenticated } = useAuth()
</script>
