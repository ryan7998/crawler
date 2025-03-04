<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold mb-6">All Crawls</h1>

        <!-- Table of Crawls -->
         <table class="min-w-full bg-white">
            <thead>
                <tr>
                    <th class="py-2 px-4 border-b">Title</th>
                    <th class="py-2 px-4 border-b">Status</th>
                    <th class="py-2 px-4 border-b">Created At</th>
                    <th class="py-2 px-4 border-b">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="crawl in crawls" :key="crawl._id" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">{{ crawl.title }}</td>
                    <td class="py-2 px-4 border-b capitalize">{{ crawl.status }}</td>
                    <td class="py-2 px-4 border-b">{{ crawl.createdAt }}</td>
                    <td class="py-2 px-4 border-b">
                        <router-link :to="{ name: 'CrawlerDashboard', params: { crawlId: crawl._id} }" class="text-blue-500 hover:underline mr-2">View</router-link>
                        <button @click="configureCrawl(crawl)" class="text-yellow-500 hover:underline mr-2 focus:outline-none">Edit</button>
                    </td>
                </tr>
            </tbody>
         </table>
    </div>
</template>
<script setup>
    import { ref, onMounted, computed } from 'vue'
    import axios from 'axios'
    import { useRouter } from 'vue-router'
    import { useCrawlStore } from '../stores/crawlStore'

    // Initialize Pinia store
    const crawlStore = useCrawlStore()
    // Initialize Vue
    const router = useRouter()

    // Reactive state
    const crawls = ref([])
    const searchQuery = ref('')
    const currentPage = ref(1)
    const totalPages = ref(1)
    const limit = ref(20)   // Items per page

    // Success and error messages
    const successMessage = ref('')
    const errorMessage = ref('')

    // Fetch crawls from the backend
    const fetchCrawls = async () => {
        try {
            const baseUrl = window.location.origin;
            const response = await axios.get(`${baseUrl}/api/getallcrawlers`, {
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
        // Set the current crawl data in the store
        crawlStore.setData(crawl);
        // Navigate to CreateCrawl component
        router.push({ name: 'CreateCrawl' });
    };

    // Pagination functions
    const goToPage = (page) => {
        if(page < 1 || page > totalPages.value) 
            return
        currentPage.value = page
        fetchCrawls()
    }

    onMounted(async () => {
        fetchCrawls()
    })
</script>