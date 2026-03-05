<template>
    <div>
        <slot></slot>
        
        <!-- Modern Notification Toast -->
        <div
            v-if="showSnackbar"
            class="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out"
            :class="{
                'border-green-500': snackbarColor === 'success',
                'border-red-500': snackbarColor === 'error',
                'border-yellow-500': snackbarColor === 'warning',
                'border-blue-500': snackbarColor === 'info'
            }"
        >
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <!-- Success Icon -->
                    <svg v-if="snackbarColor === 'success'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <!-- Error Icon -->
                    <svg v-else-if="snackbarColor === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <!-- Warning Icon -->
                    <svg v-else-if="snackbarColor === 'warning'" class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    <!-- Info Icon -->
                    <svg v-else class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ snackbarText }}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button
                        @click="hideNotification"
                        class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { provide } from 'vue'
import { useNotification } from '../../composables/useNotification'

// Use the notification composable
const {
    showSnackbar,
    snackbarText,
    snackbarColor,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
} = useNotification({ global: true })

// Provide the notification function to child components for backward compatibility
provide('showNotification', showNotification)

// Also provide individual methods for more specific usage
provide('showSuccess', showSuccess)
provide('showError', showError)
provide('showWarning', showWarning)
provide('showInfo', showInfo)
provide('hideNotification', hideNotification)
</script> 