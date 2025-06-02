<script setup>
import NotificationWrapper from './components/NotificationWrapper.vue'
import Navbar from './components/Navbar.vue';
</script>

<template>
    <NotificationWrapper>
        <div class="min-h-screen bg-gray-100 w-full">
          <Navbar />
          <router-view />
        </div>
    </NotificationWrapper>
</template>

<style scoped>
</style>
