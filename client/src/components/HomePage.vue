<template>
    <v-container>
        <h1 class="text-h4 mb-6">All Crawls</h1>

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
                    @click="configureCrawl(item)"
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
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCrawlStore } from '../stores/crawlStore'
import { getStatusColor } from '../utils/statusUtils'

// Initialize Pinia store
const crawlStore = useCrawlStore()
// Initialize Vue
const router = useRouter()
const apiUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3001'

// Table headers configuration
const headers = [
    { title: 'Title', key: 'title', sortable: true },
    { title: 'Status', key: 'status', sortable: true },
    { title: 'Updated At', key: 'updatedAt', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false }
]

// Reactive state
const crawls = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const limit = ref(20)   // Items per page

// Success and error messages
const successMessage = ref('')
const errorMessage = ref('')

// Fetch crawls from the backend
const fetchCrawls = async () => {
    try {
        const response = await axios.get(`${apiUrl}/api/getallcrawlers`, {
            params: {
                page: currentPage.value,
                limit: limit.value,
            },
        })
        crawls.value = response.data.crawls
        totalPages.value = response.data.totalPages
        console.log(response)
    } catch (error) {
        errorMessage.value = error.response ? error.response.data.message : 'Error fetching crawls'
        console.log(error)
    }
}

// Configure crawl function
const configureCrawl = (crawl) => {
    crawlStore.setData(crawl)
    router.push({ name: 'CreateCrawl' })
}

// Pagination function
const goToPage = (page) => {
    currentPage.value = page
    fetchCrawls()
}

// Helper function to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
}

onMounted(async () => {
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