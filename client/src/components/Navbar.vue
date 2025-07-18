<!-- Sleek Navbar -->
<template>
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center">
                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"/>
                    </svg>
                    <a class="text-xl font-bold text-gray-800 ml-2" href="/">Notify!!</a>
                </div>
                <div class="flex items-center space-x-2">
                    <v-btn
                        variant="outlined"
                        color="primary"
                        :loading="runAllLoading"
                        :disabled="runAllLoading"
                        @click="runAllCrawls"
                        size="small"
                    >
                        <v-icon start icon="mdi-play-circle" />
                        Run All
                    </v-btn>
                    <v-btn
                        variant="outlined"
                        color="info"
                        @click="showQueueStatusModal = true"
                        size="small"
                    >
                        <v-icon start icon="mdi-queue" />
                        Queue
                    </v-btn>
                    <v-btn
                        variant="outlined"
                        color="success"
                        @click="showGlobalExportModal = true"
                        size="small"
                    >
                        <v-icon start icon="mdi-download-multiple" />
                        Export
                    </v-btn>
                    <v-btn
                        color="primary"
                        @click="openCreateModal"
                        size="small"
                    >
                        <v-icon start icon="mdi-plus" />
                        New
                    </v-btn>
                    <a class="text-gray-500 hover:text-gray-800 ml-2" href="/">Home</a>
                </div>
            </div>
        </div>
        <!-- Modals -->
        <CreateCrawlModal
            v-model="showModal"
            :crawl-data="selectedCrawl"
            @crawl-created="handleCrawlCreated"
        />
        <GlobalExportModal
            v-model="showGlobalExportModal"
            @export-success="handleGlobalExportSuccess"
        />
        <QueueStatusModal
            v-model="showQueueStatusModal"
        />
        <v-snackbar
            v-model="showSnackbar"
            :color="snackbarColor"
            timeout="3000"
        >
            {{ snackbarText }}
        </v-snackbar>
    </nav>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import CreateCrawlModal from './CreateCrawlModal.vue'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'

const router = useRouter()
const showNotification = inject('showNotification')

// Use the crawl management composable
const {
    runAllLoading,
    showSnackbar,
    snackbarText,
    snackbarColor,
    runAllCrawls: runAllCrawlsFromComposable
} = useCrawlManagement()

// Modal state
const showModal = ref(false)
const selectedCrawl = ref(null)
const showGlobalExportModal = ref(false)
const showQueueStatusModal = ref(false)

// Open create modal
const openCreateModal = () => {
    selectedCrawl.value = null
    showModal.value = true
}

// Handle crawl creation/update
const handleCrawlCreated = (crawl) => {
    showNotification('Crawl created successfully', 'success')
    router.push({ name: 'CrawlerDashboard', params: { crawlId: crawl._id } })
}

// Handle global export success
const handleGlobalExportSuccess = (exportResult) => {
    showNotification('Global export completed successfully!', 'success')
}

// Wrapper for run all crawls
const runAllCrawls = async () => {
    await runAllCrawlsFromComposable()
}
</script>