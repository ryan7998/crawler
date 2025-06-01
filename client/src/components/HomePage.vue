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

        <v-data-table
            :headers="headers"
            :items="crawls"
            :items-per-page="limit"
            :page="currentPage"
            :server-items-length="totalPages * limit"
            @update:page="goToPage"
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
        </v-data-table>

        <!-- Create/Edit Crawl Modal -->
        <CreateCrawlModal
            v-model="showModal"
            :crawl-data="selectedCrawl"
            @crawl-created="handleCrawlCreated"
        />
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { useCrawlStore } from '../stores/crawlStore'
import { getStatusColor } from '../utils/statusUtils'
import CreateCrawlModal from './CreateCrawlModal.vue'

    // Initialize Pinia store
    const crawlStore = useCrawlStore()
    const router = useRouter()

// Table configuration
const headers = [
    { title: 'Title', key: 'title' },
    { title: 'Status', key: 'status' },
    { title: 'Created At', key: 'createdAt' },
    { title: 'Actions', key: 'actions', sortable: false }
]

// Pagination
    const currentPage = ref(1)
const limit = 10
    const totalPages = ref(1)
const crawls = ref([])

// Modal state
const showModal = ref(false)
const selectedCrawl = ref(null)

// Format date for display
const formatDate = (date) => {
    return new Date(date).toLocaleDateString()
}

// Fetch crawls with pagination
const fetchCrawls = async (page = 1) => {
        try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3001'}/api/getallcrawlers?page=${page}&limit=${limit}`)
            crawls.value = response.data.crawls
            totalPages.value = response.data.totalPages
        } catch (error) {
        console.error('Error fetching crawls:', error)
        }
    }

// Handle page changes
    const goToPage = (page) => {
        currentPage.value = page
    fetchCrawls(page)
}

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
    fetchCrawls(currentPage.value)
    if (crawl._id) {
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