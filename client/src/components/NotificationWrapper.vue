<template>
    <div>
        <slot></slot>
        <v-snackbar
            v-model="showSnackbar"
            :color="snackbarColor"
            timeout="3000"
            location="top"
        >
            {{ snackbarText }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { ref, provide } from 'vue'

// Snackbar state
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Provide a function to show notifications
const showNotification = (message, type = 'success') => {
    showSnackbar.value = true
    snackbarText.value = message
    snackbarColor.value = type
}

// Provide the notification function to child components
provide('showNotification', showNotification)
</script> 