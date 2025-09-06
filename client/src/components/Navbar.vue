<!-- Modern Navbar -->
<template>
    <nav class="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <button 
                        @click="goToDashboard"
                        class="flex items-center hover:opacity-80 transition-opacity"
                    >
                        <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
                    </svg>
                        </div>
                        <div class="ml-3">
                            <h1 class="text-xl font-bold text-gray-900">CrawlerPro</h1>
                            <p class="text-xs text-gray-600">Advanced Web Scraping</p>
                        </div>
                    </button>
                </div>
                
                <div class="flex items-center space-x-3">
                    <!-- Authentication Section -->
                    <div v-if="!isAuthenticated" class="flex items-center space-x-3">
                        <button
                            @click="openAuthModal('login')"
                            class="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            @click="openAuthModal('register')"
                            class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Get Started
                        </button>
                    </div>

                    <!-- Authenticated User Section -->
                    <div v-else class="flex items-center space-x-3">
                        <button
                            @click="openCreateModal"
                            class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>New Crawl</span>
                        </button>
                        
                        <!-- User Menu -->
                        <div class="relative">
                            <button
                                @click="showUserMenu = !showUserMenu"
                                class="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <span class="text-sm font-medium">{{ userFullName }}</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </button>
                            
                            <!-- Dropdown Menu -->
                            <div v-if="showUserMenu" class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                <button
                                    @click="showProfile = true; showUserMenu = false"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    <span>Profile</span>
                                </button>
                                <button
                                    @click="showRunAllConfirm = true; showUserMenu = false"
                                    :disabled="runAllLoading"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>Run All Crawls</span>
                                </button>
                                <button
                                    @click="showQueueStatusModal = true; showUserMenu = false"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                    </svg>
                                    <span>Queue Status</span>
                                </button>
                                <button
                                    @click="showGlobalExportModal = true; showUserMenu = false"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    <span>Export All</span>
                                </button>
                                <button
                                    @click="openGlobalSheet(); showUserMenu = false"
                                    :disabled="!globalSheetUrl"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    <span>Open Sheet</span>
                                </button>
                                <div class="border-t border-gray-200 my-2"></div>
                                <button
                                    @click="handleLogout(); showUserMenu = false"
                                    class="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                    </svg>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Modals -->
        <GlobalExportModal
            v-model="showGlobalExportModal"
            @export-success="handleGlobalExportSuccess"
        />
        <QueueStatusModal
            v-model="showQueueStatusModal"
        />
        <!-- Run All Confirmation Modal -->
        <div v-if="showRunAllConfirm" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-screen items-center justify-center p-4">
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="showRunAllConfirm = false"></div>
            <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm Run All</h3>
                <p class="text-gray-600 mb-6">Are you sure you want to run all crawls? This will start all enabled crawls that are not already in progress.</p>
                <div class="flex space-x-3 justify-end">
                  <button
                    @click="showRunAllConfirm = false"
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    @click="confirmRunAll"
                    :disabled="runAllLoading"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <svg v-if="runAllLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <span>{{ runAllLoading ? 'Running...' : 'Run All' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
    </nav>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import { useAuth } from '../composables/useAuth'
import { useCrawlStore } from '../stores/crawlStore'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'

const router = useRouter()
const showNotification = inject('showNotification')

// Define emits
const emit = defineEmits(['open-auth-modal'])

// Use the crawl management composable
const {
    runAllLoading,
    showSnackbar,
    snackbarText,
    snackbarColor,
    runAllCrawls: runAllCrawlsFromComposable,
    globalSheetUrl
} = useCrawlManagement()

// Use the auth composable
const {
    isAuthenticated,
    userFullName,
    logout
} = useAuth()

// Use the crawl store
const crawlStore = useCrawlStore()

// Modal state
const showGlobalExportModal = ref(false)
const showQueueStatusModal = ref(false)
const showRunAllConfirm = ref(false)
const showProfile = ref(false)
const showUserMenu = ref(false)

// Open create modal
const openCreateModal = () => {
    crawlStore.openCreateModal()
}


// Handle global export success
const handleGlobalExportSuccess = (exportResult) => {
    showNotification('Global export completed successfully!', 'success')
}

// Wrapper for run all crawls
const runAllCrawls = async () => {
    await runAllCrawlsFromComposable()
}

const confirmRunAll = async () => {
  showRunAllConfirm.value = false
  await runAllCrawls()
}

const openGlobalSheet = () => {
  if (globalSheetUrl.value) {
    window.open(globalSheetUrl.value, '_blank')
  }
}

// Navigation methods
const goToDashboard = () => {
  if (isAuthenticated.value) {
    router.push('/dashboard')
  } else {
    router.push('/')
  }
}

// Authentication methods
const openAuthModal = (mode) => {
  // Emit event to parent component to handle auth modal
  emit('open-auth-modal', mode)
}

const handleLogout = async () => {
  await logout()
  showNotification('Logged out successfully', 'success')
}

// Click outside handler for dropdown
const handleClickOutside = (event) => {
  if (showUserMenu.value && !event.target.closest('.relative')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>