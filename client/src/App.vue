<script setup>
import Navbar from './components/Navbar.vue';
</script>

<template>
    <div class="min-h-screen bg-gray-100 w-full">
      <Navbar />
      <router-view />
    </div>
</template>

<style scoped>
</style>
