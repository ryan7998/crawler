<template>
    <v-container>
        <!-- Search Bar -->
        <v-card class="mb-4 pa-4">
            <div class="d-flex align-center">
                <v-text-field
                    v-model="searchQuery"
                    label="Search crawls by name"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    clearable
                    hide-details
                    class="flex-grow-1 mr-4"
                    :loading="isSearching"
                    @update:model-value="handleSearch"
                    @click:clear="handleSearch"
                />
                <v-chip
                    v-if="searchQuery"
                    color="primary"
                    variant="outlined"
                    class="ml-2"
                >
                    {{ totalCrawls }} result{{ totalCrawls !== 1 ? 's' : '' }}
                </v-chip>
            </div>
        </v-card>
        
        <v-data-table
            :headers="headers"
            :items="crawls"
            :items-per-page="-1"
            hover
        >
            <!-- No results message -->
            <template v-slot:no-data>
                <div class="text-center pa-4">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-magnify</v-icon>
                    <p class="text-h6 text-grey-darken-1">
                        {{ searchQuery ? `No crawls found matching "${searchQuery}"` : 'No crawls found' }}
                    </p>
                    <p class="text-body-2 text-grey">
                        {{ searchQuery ? 'Try adjusting your search terms' : 'Create your first crawl to get started' }}
                    </p>
                </div>
            </template>
            
            <!-- Custom cell for Title column -->
            <template v-slot:item.title="{ item }">
                <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    :to="{ name: 'CrawlerDashboard', params: { crawlId: item._id } }"
                    class="text-none font-weight-medium"
                >
                    {{ item.title }}
                </v-btn>
            </template>

            <!-- Custom cell for Actions column -->
            <template v-slot:item.actions="{ item }">
                <v-btn
                    variant="text"
                    color="warning"
                    size="small"
                    @click="openEditModal(item)"
                    class="mr-2"
                >
                    Edit
                </v-btn>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      variant="text"
                      :color="item.disabled ? 'grey' : 'success'"
                      size="small"
                      :loading="disableLoadingId === item._id"
                      :disabled="disableLoadingId === item._id"
                      @click="toggleDisableCrawl(item)"
                      class="mr-2"
                    >
                      <v-icon>
                        {{ item.disabled ? 'mdi-toggle-switch-off-outline' : 'mdi-toggle-switch' }}
                      </v-icon>
                    </v-btn>
                  </template>
                  <span>{{ item.disabled ? 'Enable' : 'Disable' }} Crawl</span>
                </v-tooltip>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      variant="text"
                      color="error"
                      size="small"
                      :loading="deleteLoadingId === item._id"
                      :disabled="deleteLoadingId === item._id"
                      @click="confirmDeleteCrawl(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>Delete Crawl</span>
                </v-tooltip>
            </template>

            <!-- Custom cell for Status column -->
            <template v-slot:item.status="{ item }">
                <v-chip
                    :color="item.status === 'in-progress' ? 'blue' : getStatusColor(item.status)"
                    size="small"
                    class="text-capitalize"
                >
                    <v-icon v-if="item.status === 'in-progress'" start icon="mdi-progress-clock" />
                    {{ item.status }}
                </v-chip>
            </template>

            <!-- Custom cell for Created At column -->
            <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.updatedAt) }}
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

        <v-snackbar
            v-model="showSnackbar"
            :color="snackbarColor"
            timeout="3000"
        >
            {{ snackbarText }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCrawlStore } from '../stores/crawlStore'
import { getStatusColor } from '../utils/statusUtils'
import { formatDate, getApiUrl } from '../utils/commonUtils'
import { useCrawlManagement } from '../composables/useCrawlManagement'
import CreateCrawlModal from './CreateCrawlModal.vue'
import GlobalExportModal from './GlobalExportModal.vue'
import QueueStatusModal from './QueueStatusModal.vue'

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
    { title: 'Title', key: 'title', align: 'center' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Last Run', key: 'createdAt', align: 'center' },
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

// Search query
const searchQuery = ref('')

// Debounced search function
let searchTimeout = null

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


onMounted(() => {
    fetchCrawls()
})
</script>

<style scoped>
.v-data-table {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 