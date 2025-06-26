<template>
    <v-container>
        <div class="d-flex justify-space-between align-center mb-6">
            <h1 class="text-h4">All Crawls</h1>
            <v-btn
                color="primary"
                @click="openCreateModal"
            >
                <v-icon start icon="mdi-plus" />
                New Crawl
            </v-btn>
        </div>
        
        <v-data-table-server
            :headers="headers"
            :items="crawls"
            v-model:options="options"                
            :items-length="totalCrawls"              
            hover
        >
            <!-- Custom cell for Actions column -->
            <template v-slot:item.actions="{ item }">
                <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    :to="{ name: 'CrawlerDashboard', params: { crawlId: item._id } }"
                    class="mr-2"
                >
                    View
                </v-btn>
                <v-btn
                    variant="text"
                    color="warning"
                    size="small"
                    @click="openEditModal(item)"
                >
                    Edit
                </v-btn>
            </template>

            <!-- Custom cell for Status column -->
            <template v-slot:item.status="{ item }">
                <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    class="text-capitalize"
                >
                    {{ item.status }}
                </v-chip>
            </template>

            <!-- Custom cell for Created At column -->
            <template v-slot:item.createdAt="{ item }">
                {{ formatDate(item.updatedAt) }}
            </template>
        </v-data-table-server>

        <!-- Create/Edit Crawl Modal -->
        <CreateCrawlModal
            v-model="showModal"
            :crawl-data="selectedCrawl"
            @crawl-created="handleCrawlCreated"
        />
    </v-container>
</template>

<script setup>
import { ref, onMounted, inject, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCrawlStore } from '../stores/crawlStore'
import { getStatusColor } from '../utils/statusUtils'
import { formatDate, getApiUrl } from '../utils/commonUtils'
import CreateCrawlModal from './CreateCrawlModal.vue'

// Initialize Pinia store
const crawlStore = useCrawlStore()
const router = useRouter()

// Inject the notification function
const showNotification = inject('showNotification')

// Table configuration
const headers = [
    { title: 'Title', key: 'title', align: 'center' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Created At', key: 'createdAt', align: 'center' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

// Vuetify server-side pagination options
const options = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    sortDesc: [],
    groupBy: [],
    groupDesc: [],
    multiSort: false,
    mustSort: false,
})
const totalCrawls = ref(0)
const crawls = ref([])

// Modal state
const showModal = ref(false)
const selectedCrawl = ref(null)

// Fetch crawls with pagination
const fetchCrawls = async () => {
    try {
        const { page, itemsPerPage } = options.value
        const response = await axios.get(`${getApiUrl()}/api/getallcrawlers?page=${page}&limit=${itemsPerPage}`)
        crawls.value = response.data.crawls
        totalCrawls.value = response.data.totalCrawls
    } catch (error) {
        console.error('Error fetching crawls:', error)
        showNotification('Error fetching crawls', 'error')
    }
}

// Watch for changes in options to fetch data
watch(options, fetchCrawls, { deep: true })

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