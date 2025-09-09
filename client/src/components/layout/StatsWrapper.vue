<template>
  <div class="relative">
    <!-- Page Content -->
    <slot />
    
    <!-- Fixed Bottom Stats Bar -->
    <StatsBottomBar />
  </div>
</template>

<script setup>
import StatsBottomBar from '../ui/stats/StatsBottomBar.vue'
</script>
