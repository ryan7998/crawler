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
                            <tr v-for="(url, index) in crawl.urls" :key="index" class="text-gray-700 border-b">
                            <td class="py-2">{{ url }}</td>
                            <td class="py-2">
                                <!-- <span
                                :class="[
                                    'inline-block px-2 py-1 rounded-full text-sm',
                                    url.status === 'completed' ? 'bg-green-100 text-green-600' : url.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                ]"
                                >
                                {{ url.status }}
                                </span> -->
                                Status goes here..
                            </td>
                            </tr>
                        </tbody>
                        </table>

                        <!-- Results Section -->
                         <div v-if="crawl.result?.length">
                             <h6 class="mt-6 text-gray-700 font-semibold">Results</h6>
                             <ol class="list-none mt-2 space-y-2">
                                <li v-for="(result, index) in crawl.result" :key="index" class="bg-gray-50 p-2 rounded-lg">
                                    <div> {{ result.url }}</div>
                                    <div><strong>Title: </strong> {{ result.data.title }}</div>
                                </li>
                             </ol>
                         </div>
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
    import { onMounted, ref, reactive, watch } from 'vue'
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
        })
        // Listen for crawl completion
        socket.value.on("crawlCompleted", (data) => {
            console.log('crawl completed')
            logs.value.push({
                url: data.url,
                status: "completed",
                data: data.result
            })
        })

        // Listen for crawl failures
        socket.value.on('crawlFailed', (data) => {
            errors.value.push({
            url: data.url,
            message: data.error,
            });
        })

        socket.value.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        socket.value.on('disconnect', () => {
            console.log('Disconnected from Socket.io server');
        });
    }, 
)
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

