<template>
    <!-- Main Content -->
    <div class="container mx-auto px-4 mt-8">
        <!-- Search Bar with Stats Button -->
        <v-card class="mb-4 pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center flex-grow-1 mr-4">
                    <v-text-field
                        v-model="searchQuery"
                        label="Search crawls by name"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        clearable
                        hide-details
                        class="flex-grow-1"
                        :loading="isSearching"
                        @update:model-value="handleSearch"
                        @click:clear="handleSearch"
                    />
                    <v-chip
                        v-if="searchQuery || selectedStatus !== 'all'"
                        color="primary"
                        variant="outlined"
                        class="ml-2"
                    >
                        {{ filteredCrawls.length }} result{{ filteredCrawls.length !== 1 ? 's' : '' }}
                    </v-chip>
                </div>
                <v-btn
                    variant="outlined"
                    color="info"
                    @click="showStatsModal = true"
                    prepend-icon="mdi-chart-box"
                >
                    View Stats
                </v-btn>
            </div>
            
            <!-- Status Filter -->
            <div class="d-flex align-center">
                <span class="text-subtitle-2 font-weight-medium mr-3">Status:</span>
                <div class="d-flex gap-1">
                    <v-chip
                        v-for="status in statusOptions"
                        :key="status.value"
                        :color="selectedStatus === status.value ? 'primary' : 'default'"
                        :variant="selectedStatus === status.value ? 'elevated' : 'outlined'"
                        @click="toggleStatusFilter(status.value)"
                        class="cursor-pointer"
                        size="small"
                    >
                        <v-icon :icon="status.icon" start size="x-small" />
                        {{ status.label }}
                        <span class="ml-1">({{ getStatusCount(status.value) }})</span>
                    </v-chip>
                </div>
                <v-spacer />
                <v-btn
                    v-if="selectedStatus !== 'all'"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="clearStatusFilter"
                >
                    Clear Filter
                </v-btn>
            </div>
        </v-card>

        <!-- Global Proxy Stats Widget -->
        <div class="mb-4">
            <ProxyStatsWidget
                :stats="globalProxyStats"
                :loading="globalProxyStatsLoading"
                :error="globalProxyStatsError"
                :show-actions="false"
                :show-cleanup="true"
                @refresh="fetchGlobalProxyStats"
                @cleanup="showCleanupDialog = true"
            />
        </div>
        
        <v-data-table
            :headers="headers"
            :items="filteredCrawls"
            :items-per-page="-1"
            hover
            class="elevation-2 rounded-lg custom-table"
            density="comfortable"
        >
            <!-- No results message -->
            <template v-slot:no-data>
                <div class="text-center pa-8">
                    <v-icon size="80" color="grey-lighten-2" class="mb-4">mdi-magnify</v-icon>
                    <h3 class="text-h5 text-grey-darken-1 mb-2">
                        {{ searchQuery ? `No crawls found matching "${searchQuery}"` : 'No crawls found' }}
                    </h3>
                    <p class="text-body-1 text-grey mb-4">
                        {{ searchQuery ? 'Try adjusting your search terms or create a new crawl' : 'Get started by creating your first crawl' }}
                    </p>
                    <v-btn
                        v-if="!searchQuery"
                        color="primary"
                        @click="openCreateModal"
                        prepend-icon="mdi-plus"
                    >
                        Create Your First Crawl
                    </v-btn>
                </div>
            </template>
            
            <!-- Custom cell for Title column -->
            <template v-slot:item.title="{ item }">
                <div class="d-flex align-center">
                    <v-btn
                        variant="text"
                        color="primary"
                        size="small"
                        :to="{ name: 'CrawlerDashboard', params: { crawlId: item._id } }"
                        class="text-none font-weight-medium text-left text-body-2"
                    >
                        {{ item.title }}
                    </v-btn>
                    <v-chip
                        v-if="item.disabled"
                        size="x-small"
                        color="grey"
                        class="ml-2"
                    >
                        Disabled
                    </v-chip>
                </div>
            </template>

            <!-- Custom cell for URLs column -->
            <template v-slot:item.urls="{ item }">
                <div class="text-center text-body-2">
                    {{ item.urls ? item.urls.length : 0 }}
                </div>
            </template>

            <!-- Custom cell for Actions column -->
            <template v-slot:item.actions="{ item }">
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-btn
                            variant="text"
                            color="primary"
                            v-bind="props"
                            size="small"
                        >
                            <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>
                    <v-list>
                        <v-list-item @click="openEditModal(item)">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-pencil" />
                            </template>
                            <v-list-item-title>Edit</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="toggleDisableCrawl(item)" :disabled="disableLoadingId === item._id">
                            <template v-slot:prepend>
                                <v-icon :icon="item.disabled ? 'mdi-toggle-switch-off-outline' : 'mdi-toggle-switch'" />
                            </template>
                            <v-list-item-title>{{ item.disabled ? 'Enable' : 'Disable' }} Crawl</v-list-item-title>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item @click="confirmDeleteCrawl(item)" :disabled="deleteLoadingId === item._id">
                            <template v-slot:prepend>
                                <v-icon icon="mdi-delete" color="error" />
                            </template>
                            <v-list-item-title class="text-error">Delete Crawl</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>

            <!-- Custom cell for Status column -->
            <template v-slot:item.status="{ item }">
                <div class="text-center">
                    <v-chip
                        :color="item.status === 'in-progress' ? 'blue' : getStatusColor(item.status)"
                        size="small"
                        class="text-capitalize mb-1 text-body-2"
                    >
                        <v-icon v-if="item.status === 'in-progress'" start icon="mdi-progress-clock" />
                        <v-icon v-else-if="item.status === 'completed'" start icon="mdi-check-circle" />
                        <v-icon v-else-if="item.status === 'failed'" start icon="mdi-alert-circle" />
                        <v-icon v-else start icon="mdi-clock-outline" />
                        {{ item.status }}
                    </v-chip>
                    <div v-if="item.aggregatedData" class="text-caption text-grey">
                        {{ Object.keys(item.aggregatedData).length }} URLs
                    </div>
                </div>
            </template>

            <!-- Custom cell for Last Run column -->
            <template v-slot:item.lastRun="{ item }">
                <v-tooltip location="top">
                    <template #activator="{ props }">
                        <div v-bind="props" class="text-center cursor-pointer">
                            <div class="text-body-2">
                                {{ getRelativeTime(item.endTime || item.updatedAt) }}
                            </div>
                        </div>
                    </template>
                    <span>{{ formatDateTime(item.endTime || item.updatedAt) }}</span>
                </v-tooltip>
            </template>
        </v-data-table>

        <!-- Create/Edit Crawl Modal -->
        <CreateCrawlModal
            v-model="showModal"
            :crawl-data="selectedCrawl"
            @crawl-created="handleCrawlCreated"
        />

        <!-- Global Export Modal -->
        <GlobalExportModal
            v-model="showGlobalExportModal"
            @export-success="handleGlobalExportSuccess"
        />

        <!-- Queue Status Modal -->
        <QueueStatusModal
            v-model="showQueueStatusModal"
        />

        <!-- Statistics Modal -->
        <v-dialog v-model="showStatsModal" max-width="600">
            <v-card>
                <v-card-title class="text-h5 d-flex align-center">
                    <v-icon icon="mdi-chart-box" class="mr-2" />
                    Crawl Statistics
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-card class="text-center pa-4" variant="outlined">
                                <v-icon size="40" color="primary" class="mb-3">mdi-web</v-icon>
                                <div class="text-h4 font-weight-bold text-primary">{{ totalCrawls }}</div>
                                <div class="text-subtitle-1">Total Crawls</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-card class="text-center pa-4" variant="outlined">
                                <v-icon size="40" color="success" class="mb-3">mdi-check-circle</v-icon>
                                <div class="text-h4 font-weight-bold text-success">{{ completedCrawls }}</div>
                                <div class="text-subtitle-1">Completed</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-card class="text-center pa-4" variant="outlined">
                                <v-icon size="40" color="error" class="mb-3">mdi-alert-circle</v-icon>
                                <div class="text-h4 font-weight-bold text-error">{{ failedCrawls }}</div>
                                <div class="text-subtitle-1">Failed</div>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-card class="text-center pa-4" variant="outlined">
                                <v-icon size="40" color="info" class="mb-3">mdi-progress-clock</v-icon>
                                <div class="text-h4 font-weight-bold text-info">{{ inProgressCrawls }}</div>
                                <div class="text-subtitle-1">In Progress</div>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                    <!-- Additional Stats -->
                    <v-divider class="my-4"></v-divider>
                    <div class="text-center">
                        <div class="text-h6 mb-2">Success Rate</div>
                        <div class="text-h3 font-weight-bold text-success">
                            {{ totalCrawls > 0 ? Math.round((completedCrawls / totalCrawls) * 100) : 0 }}%
                        </div>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showStatsModal = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="showDeleteConfirm" max-width="400">
            <v-card>
                <v-card-title class="text-h6">Confirm Delete</v-card-title>
                <v-card-text>
                    Are you sure you want to delete "{{ crawlToDelete?.title }}"? This action cannot be undone.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn @click="showDeleteConfirm = false">Cancel</v-btn>
                    <v-btn 
                        color="error" 
                        :loading="deleteLoadingId === crawlToDelete?._id"
                        @click="deleteCrawl"
                    >
                        Delete
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Cleanup Confirmation Dialog -->
        <v-dialog v-model="showCleanupDialog" max-width="400px">
            <v-card>
                <v-card-title>Cleanup Old Proxy Data</v-card-title>
                <v-card-text>
                    <p>This will permanently delete proxy usage records older than the specified number of days.</p>
                    <v-text-field
                        v-model="cleanupDays"
                        label="Days to keep"
                        type="number"
                        variant="outlined"
                        density="compact"
                        :rules="[v => v > 0 || 'Must be greater than 0']"
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="outlined" @click="showCleanupDialog = false">Cancel</v-btn>
                    <v-btn
                        color="warning"
                        @click="performCleanup"
                        :loading="globalProxyStatsLoading"
                    >
                        Cleanup
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar
            v-model="showSnackbar"
            :color="snackbarColor"
            timeout="3000"
        >
            {{ snackbarText }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { ref, onMounted, inject, watch, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCrawlStore } from '../stores/crawlStore'
import { getStatusColor } from '../utils/statusUtils'
import { formatDate, formatDateTime, getRelativeTime, getApiUrl } from '../utils/commonUtils'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import CreateCrawlModal from './CreateCrawlModal.vue'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'
import ProxyStatsWidget from './ui/ProxyStatsWidget.vue'
import { useProxyStats } from '../composables/useProxyStats'

// Initialize Pinia store
const crawlStore = useCrawlStore()
const router = useRouter()

// Inject the notification function
const showNotification = inject('showNotification')

// Use the crawl management composable
const {
    crawls,
    totalCrawls,
    isSearching,
    runAllLoading,
    disableLoadingId,
    showSnackbar,
    snackbarText,
    snackbarColor,
    fetchCrawls: fetchCrawlsFromComposable,
    runAllCrawls: runAllCrawlsFromComposable,
    toggleDisableCrawl: toggleDisableCrawlFromComposable
} = useCrawlManagement()

// Table configuration
const headers = [
    { title: 'Title', key: 'title', align: 'start' },
    { title: 'URLs', key: 'urls', align: 'center', width: '100px' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Last Run', key: 'lastRun', align: 'center' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

// No pagination needed - showing all crawls

// Modal state
const showModal = ref(false)
const selectedCrawl = ref(null)
const showGlobalExportModal = ref(false)
const showQueueStatusModal = ref(false)
const showDeleteConfirm = ref(false)
const crawlToDelete = ref(null)
const deleteLoadingId = ref(null)
const showStatsModal = ref(false)
const showCleanupDialog = ref(false)
const cleanupDays = ref(90)

// Initialize proxy stats composable
const {
  globalStats,
  loading: globalProxyStatsLoading,
  error: globalProxyStatsError,
  fetchGlobalProxyStats,
  formattedGlobalStats,
  cleanupProxyUsage
} = useProxyStats()

// Computed properties for global proxy stats
const globalProxyStats = computed(() => formattedGlobalStats.value)

// Search query
const searchQuery = ref('')

// Status filter state
const selectedStatus = ref('all')

// Status filter options
const statusOptions = [
    { value: 'all', label: 'All', icon: 'mdi-view-list' },
    { value: 'completed', label: 'Completed', icon: 'mdi-check-circle' },
    { value: 'failed', label: 'Failed', icon: 'mdi-alert-circle' },
    { value: 'in-progress', label: 'In Progress', icon: 'mdi-progress-clock' },
    { value: 'pending', label: 'Pending', icon: 'mdi-clock-outline' }
]

// Computed properties for statistics
const completedCrawls = computed(() => {
    return crawls.value.filter(crawl => crawl.status === 'completed').length
})

const failedCrawls = computed(() => {
    return crawls.value.filter(crawl => crawl.status === 'failed').length
})

const inProgressCrawls = computed(() => {
    return crawls.value.filter(crawl => crawl.status === 'in-progress').length
})

// Computed property for filtered crawls
const filteredCrawls = computed(() => {
    if (selectedStatus.value === 'all') {
        return crawls.value
    }
    return crawls.value.filter(crawl => crawl.status === selectedStatus.value)
})

// Function to get count for each status
const getStatusCount = (status) => {
    if (status === 'all') {
        return crawls.value.length
    }
    return crawls.value.filter(crawl => crawl.status === status).length
}

// Debounced search function
let searchTimeout = null

// Status filter functions
const toggleStatusFilter = (status) => {
    selectedStatus.value = status
}

const clearStatusFilter = () => {
    selectedStatus.value = 'all'
}

// Wrapper function to call the composable's fetchCrawls with search only
const fetchCrawls = async () => {
    await fetchCrawlsFromComposable({ page: 1, itemsPerPage: 1000 }, searchQuery.value)
}

// Handle search with debouncing
const handleSearch = () => {
    // Clear existing timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
        fetchCrawls()
    }, 300) // 300ms delay
}

// No need to watch options since we're not using pagination

// Open create modal
const openCreateModal = () => {
    selectedCrawl.value = null
    showModal.value = true
}

// Open edit modal
const openEditModal = (crawl) => {
    selectedCrawl.value = crawl
    showModal.value = true
}

// Handle crawl creation/update
const handleCrawlCreated = (crawl) => {
    fetchCrawls()
    if (crawl._id) {
        showNotification('Crawl created successfully', 'success')
        router.push({ name: 'CrawlerDashboard', params: { crawlId: crawl._id } })
    }
}

// Handle global export success
const handleGlobalExportSuccess = (exportResult) => {
    showNotification('Global export completed successfully!', 'success')
}

// Wrapper functions to call the composable's functions
const runAllCrawls = async () => {
    await runAllCrawlsFromComposable()
}

const toggleDisableCrawl = async (item) => {
    await toggleDisableCrawlFromComposable(item)
}

// Delete crawl functions
const confirmDeleteCrawl = (crawl) => {
    crawlToDelete.value = crawl
    showDeleteConfirm.value = true
}

const deleteCrawl = async () => {
    if (!crawlToDelete.value) return
    
    deleteLoadingId.value = crawlToDelete.value._id
    try {
        await axios.delete(`${getApiUrl()}/api/deletecrawl/${crawlToDelete.value._id}`)
        showDeleteConfirm.value = false
        crawlToDelete.value = null
        showNotification('Crawl deleted successfully', 'success')
        fetchCrawls() // Refresh the list
    } catch (error) {
        showNotification(error.response?.data?.message || 'Error deleting crawl', 'error')
    } finally {
        deleteLoadingId.value = null
    }
}

// Proxy cleanup function
const performCleanup = async () => {
    try {
        await cleanupProxyUsage(cleanupDays.value)
        showCleanupDialog.value = false
        await fetchGlobalProxyStats() // Refresh data after cleanup
        showNotification('Proxy data cleanup completed successfully', 'success')
    } catch (error) {
        showNotification('Error performing cleanup', 'error')
    }
}

onMounted(() => {
    fetchCrawls()
    fetchGlobalProxyStats()
})
</script>

<style scoped>
.v-data-table {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.v-data-table :deep(.v-data-table-header) {
    background-color: #f8f9fa;
    font-weight: 600;
}

.v-data-table :deep(.v-data-table__tr:hover) {
    background-color: #f5f5f5;
}

.v-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s ease;
}

.v-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.custom-table :deep(.v-data-table-header) {
    min-height: 60px;
}

.custom-table :deep(.v-data-table__tr) {
    min-height: 60px;
}

.custom-table :deep(.v-data-table__td) {
    padding: 16px 8px;
    vertical-align: middle;
}

.custom-table :deep(.v-data-table__th) {
    padding: 16px 8px;
    vertical-align: middle;
}
</style> 