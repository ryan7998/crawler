<template>
    <!-- Main Content -->
    <div class="container mx-auto px-4 mt-8">
        <div class="flex space-x-4">
            
            <!-- Sidebar Actions -->
            <div class="w-1/4 space-y-2">
                <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
                    <h6 class="font-semibold text-gray-700 mb-4">Crawl Stats</h6>
                    <h2><strong>Name:</strong> {{ crawl.title }}</h2>
                    <p><strong>Crawl Id:</strong> {{ crawlId }}</p>
                    <p><strong>Status:</strong> {{ crawl.status }}</p>
                    <p><strong>Start Time:</strong> {{ formatTime(crawl.startTime) }}</p>
                    <p><strong>End Time:</strong> {{ formatTime(crawl.endTime) }}</p>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h6 class="font-semibold text-gray-700 mb-4">Actions</h6>
                    <button @click="configureCrawl" class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3">Configure</button>
                    <button @click="confirmDelete" class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3">Delete</button>
                    <button @click="startCrawl" class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3">Restart</button>
                </div>
            </div>

            <!-- Crawl Summary and Details -->
            <div class="w-3/4">
                <!-- Crawl Details -->
                <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
                    <h6 class="text-gray-700 font-semibold mb-4">Crawl Details</h6>
                    <table class="w-full text-left">
                    <thead>
                        <tr class="text-sm text-gray-600 uppercase tracking-wide border-b">
                            <th class="py-2">URL</th>
                            <th class="py-2">Status</th>
                            <th class="py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(data, url) in crawl.aggregatedData" :key="url" class="text-gray-700 border-b">
                            <td class="py-2">
                                <!-- Use excerpt composable for the URL -->
                                {{ excerpts[url].excerpt }}
                                <a v-if="url.length > 30" href = "#" @click.prevent="excerpts[url].toggleExpand">
                                    {{ excerpts[url].isExpanded ? 'Read less' : 'Read more' }}
                                </a>
                            </td>
                            <td class="py-2">
                                <span v-if="liveStatusDictionary?.[url] === 'started'">
                                    <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                    </svg>
                                </span>
                                <span v-else-if="liveStatusDictionary[url] || data[data.length-1]?.status"
                                    :class="[
                                    'inline-block px-2 py-1 rounded-full text-sm',
                                    ( liveStatusDictionary[url] || data[data.length-1]?.status ) === 'success' ? 'bg-green-100 text-green-600' : ( liveStatusDictionary[url] || data[data.length-1]?.status ) === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                ]"
                                > {{ liveStatusDictionary[url] || data[data.length-1]?.status }} </span>
                                <span v-else-if="!data.length"
                                    :class="[
                                        'inline-block px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-600',
                                    ]"
                                >
                                    pending
                                </span>

                            </td>
                            <td>
                                <a href="#" @click.prevent="openViewResult(url)" >View</a>
                                <SlideOver v-if="viewResults[url]" @close-slide-over="onCloseSlideOver(url)">
                                    <template v-slot:title>
                                        {{ data[data.length-1]?.data?.defaultData?.title || url }}
                                    </template>
                                    <template #default>
                                        <ViewResult :data="data" :url="url" :key="url" />
                                    </template>
                                </SlideOver>
                            </td>
                        </tr>
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
            <!-- Confirmation Modal -->
            <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-lg">
                <h3 class="text-lg font-semibold">Confirm Deletion</h3>
                <p>Are you sure you want to delete this crawl? This action cannot be undone.</p>
                <div class="flex justify-end mt-4 space-x-2">
                <button @click="deleteCrawl" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                <button @click="cancelDelete" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
            </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue'
    import { io } from "socket.io-client"
    import { useRoute, useRouter } from 'vue-router'
    import axios from 'axios'
    import { useCrawlStore } from '../stores/crawlStore'
    import ViewResult from './ViewResult.vue'
    import { useExcerpts } from '../composables/useExcerpts'
    import SlideOver from './SlideOver.vue'

    const logs = ref([])  // Reactive state for successfull crawl results
    const socket = ref(io("http://localhost:3002"))    // Ref from the socket instance
    const route = useRoute()    //Access the crawl ID from the URL
    const router = useRouter()
    const crawlId = ref(route.params.crawlId)   // Get crawlId from URL
    const crawl = ref(null); // To store crawl data
    const errorMessage = ref(''); // To store any error messages
    const liveStatusDictionary = ref({}) // To store status by listening the socket
    const viewResults = ref({})
    const excerpts = ref({}) // Store excerpts for each URL
    const showConfirm = ref(false) // Controle the visibility of the confirmation modal


    const openViewResult = (url) => {
      // Set the clicked URL to true in the viewResults object
      viewResults.value = { ...viewResults.value, [url]: true }
    }

    const onCloseSlideOver = (url) => {
        // Set the clicked URL to false to close the ViewResult component
        viewResults.value = { ...viewResults.value, [url]: false };
    }

    // Function to format time
    const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleString();
    };

    // Initialize Socket.io connection on component mount
    onMounted(async () => {

        crawlId.value = route.params.crawlId
        // socket.value = io("http://localhost:3002")

        // Fetch the crawl data
        try {
            const response = await axios.get(`http://localhost:3001/api/getcrawler/${crawlId.value}`)
            crawl.value = response.data // Assign response data to the crawl object

            // Initiate excerpt for each URL
            // console.log(Object.keys(crawl.value.aggregatedData))
            Object.keys(crawl.value.aggregatedData).forEach((url) => {
                excerpts.value[url] = useExcerpts(ref(url), 30)
            });
        } catch (error) {
            errorMessage.value = error.response ? error.response.data.message : 'Error fetching data'
        }
        
        // Join the room for the specific crawl ID
        socket.value.emit('joinCrawl', crawlId.value)
        // Listen for crawl logs
        socket.value.on("crawlLog", (data) => {
            console.log('logging', data)
            logs.value.push(data)
            liveStatusDictionary.value[data.url.url] = data.status

            // append new crawled data into FE rather than making a new api call to update the new results
            if (data.status === 'success') {
                crawl.value.aggregatedData[data.url.url]
                    .push({data: data.result, date: new Date(), status: data.status})
            }

        })

        socket.value.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        socket.value.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
        });

    })

    const configureCrawl = () => {
        const crawlStore = useCrawlStore()

        // Set the data in the store
        crawlStore.setData(crawl.value)
        // Navigate to CreateCrawl
        router.push({ name: 'CreateCrawl'})
    }

    const startCrawl = async () => {
        console.log('crawl started from FE')
        try {
            const requestBody = {
                urls: crawl.value.urls,
                crawlId: crawlId.value,
                selectors: crawl.value.selectors || []

            }
            // Make a POST request to start the crawl
            const response = await axios.post('http://localhost:3001/api/startcrawl', requestBody)
            console.log('Crawl started: ', response.data)
            crawl.value.status = 'in-progress'
        } catch (error) {
            console.log('Error starting crawl: ', error.response ?  error.data.message : error.message)
        }
    }

    // Function to show the confirmation modal
    const confirmDelete = () => {
        showConfirm.value = true
    }

    const cancelDelete = () => {
        showConfirm.value = false
    }

    const deleteCrawl = async () => {
        try {
            await axios.delete(`http://localhost:3001/api/deletecrawl/${crawlId.value}`)
            showConfirm.value = false
            router.push('/') // Redirect to homepage
        } catch (error) {
            console.error('Error deleting crawl: ', error.response ? error.response.data.message : error.message)
            errorMessage.value = error.response ? error.response.data.message : 'Error deleting crawl'
            showConfirm.value = false
        }
    }
</script>

