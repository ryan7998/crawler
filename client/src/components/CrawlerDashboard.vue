<template>
    <div class="min-h-screen bg-gray-100 w-full">
        <!-- Sleek Navbar -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                <div class="flex">
                    <a class="text-xl font-bold text-gray-800" href="#">Crawler Dashboard</a>
                </div>
                <div class="flex space-x-4">
                    <a class="text-gray-500 hover:text-gray-800" href="#">Home</a>
                    <a class="text-gray-500 hover:text-gray-800" href="#">Settings</a>
                </div>
                </div>
            </div>
        </nav>

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
                        <button class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3">Pause</button>
                        <button class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3">Resume</button>
                        <button class="w-full bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-100 py-2 px-4 rounder-md transition-all mb-3"  @click="startCrawl">Restart</button>
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
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(data, url) in crawl.aggregatedData" :key="url" class="text-gray-700 border-b">
                            <td class="py-2">

                                {{ url }}
                            </td>
                            <td class="py-2">
                                <span v-if="statusDictionary?.[url] === 'started'">
                                    <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                    </svg>
                                </span>
                                <span v-else
                                    :class="[
                                    'inline-block px-2 py-1 rounded-full text-sm',
                                    ( statusDictionary[url] || data[data.length-1].status ) === 'success' ? 'bg-green-100 text-green-600' : (  statusDictionary[url] || data[data.length-1].status ) === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                ]"
                                > {{  statusDictionary[url] || data[data.length-1].status  }} </span>
                            </td>
                            </tr>
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
         </div>
        
        <!-- Crawl Logs -->
        <div v-if="logs.length" class="results">
            <h2>Live logs</h2>
            <ul>
                <li v-for="(result, index) in logs" :key="index">
                    <template v-if="typeof result === 'object'">
                        <strong>URL:</strong> {{ result.url }} <br />
                        <strong>Status:</strong> {{ result.status }} <br />
                        <strong>Data:</strong> {{ result.data ? result.data : 'N/A' }} <br />
                    </template>
                    <template v-else>
                        {{ result ? result : 'N/A' }} <br />
                    </template>
                </li>
            </ul>
        </div>
        <div v-if="errors.length" class="errors">
            <h2>Failed Crawls:</h2>
            <ul>
                <li v-for="(error, index) in errors" :key="index">
                <strong>URL:</strong> {{ error.url }} <br />
                <strong>Error:</strong> {{ error.message }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref, reactive, watch, computed } from 'vue'
    import { io } from "socket.io-client"
    import { useRoute } from 'vue-router'
    import axios from 'axios'

    const logs = ref([])  // Reactive state for successfull crawl results
    const errors = ref([])  // Reactive state for failed crawl results
    const socket = ref(io("http://localhost:3002"))    // Ref from the socket instance
    const route = useRoute()    //Access the crawl ID from the URL
    const crawlId = ref(route.params.crawlId)   // Get crawlId from URL
    const crawl = ref(null); // To store crawl data
    const errorMessage = ref(''); // To store any error messages
    const statusDictionary = ref({}) // To store status by listening the socket
    
    // Function to format time
    const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(time).toLocaleString();
    };

    // Watch for route changes to ensure crawlId is updated when the URL changes
    watch(route, async () => {
        crawlId.value = route.params.crawlId
        // socket.value = io("http://localhost:3002")

        // Fetch the crawl data
        try {
            const response = await axios.get(`http://localhost:3001/api/getcrawler/${crawlId.value}`)
            crawl.value = response.data // Assign response data to the crawl object
        } catch (error) {
            errorMessage.value = error.response ? error.response.data.message : 'Error fetching data'
        }
        
        // Join the room for the specific crawl ID
        socket.value.emit('joinCrawl', crawlId.value)
        // Listen for crawl logs
        socket.value.on("crawlLog", (data) => {
            console.log('logging', data)
            logs.value.push(data)
            statusDictionary.value[data.url] = data.status

        })
        // // Listen for crawl completion
        // socket.value.on("crawlCompleted", (data) => {
        //     console.log('crawl completed')
        //     logs.value.push({
        //         url: data.url,
        //         status: "completed",
        //         data: data.results
        //     })
        // })

        // // Listen for crawl failures
        // socket.value.on('crawlFailed', (data) => {
        //     errors.value.push({
        //     url: data.url,
        //     message: data.error,
        //     });
        // })

        socket.value.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        socket.value.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
        });
    })

    // const urlStatus = computed((url)=>{
    //     return statusDictionary[url]
    // })

    // Initialize Socket.io connection on component mount
    onMounted(() => {

        //test

    })

    // Actions (these functions would need to emit the corresponding Socket.io events)
    const pauseCrawl = () => {
    console.log("Pausing crawl");
    };

    const resumeCrawl = () => {
    console.log("Resuming crawl");
    };

    const startCrawl = async () => {
        console.log('crawl started from FE')
        try {
            const requestBody = {
                urls: crawl.value.urls,
                crawlId: crawlId.value
            }

            // Make a POST request to start the crawl
            const response = await axios.post('http://localhost:3001/api/startcrawl', requestBody)
            console.log('Crawl started: ', response.data)
            crawl.value.status = 'in-progress'
        } catch (error) {
            console.log('Error starting crawl: ', error.response ?  error.data.message : error.message)
        }
    };
</script>

