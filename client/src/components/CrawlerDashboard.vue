<template>
    <div>
        <h1>Crawler Dashboard</h1>
        <!-- Display Crawl Data -->
        <div v-if="crawl">
            <h2>{{ crawl.title }}</h2>
            <p><strong>Status:</strong> {{ crawl.status }}</p>
            <p><strong>Start Time:</strong> {{ formatTime(crawl.startTime) }}</p>
            <p><strong>End Time:</strong> {{ formatTime(crawl.endTime) }}</p>

            <h3>URLs:</h3>
            <ul>
                <li v-for="(url, index) in crawl.urls" :key="index">{{ url }}</li>
            </ul>

            <h3>Selectors:</h3>
            <ul>
                <li v-for="(selector, index) in crawl.selectors" :key="index">{{ selector }}</li>
            </ul>

            <h3>Results:</h3>
            <ul v-if="crawl.result.length">
                <li v-for="(result, index) in crawl.result" :key="index">{{ result }}</li>
            </ul>
            <p v-else>No results available</p>

            <h3 v-if="crawl.error">Error:</h3>
            <p v-if="crawl.error">{{ crawl.error }}</p>
        </div>
        
        <!-- Error message -->
        <p v-if="errorMessage">{{ errorMessage }}</p>
        
        <div v-if="results" class="results">
            <h2>Crawl Results</h2>
            <p>Crawl Id: {{ crawlId }}</p>
            <ul>
                <li v-for="(result, index) in results" :key="index">
                    <strong>URL:</strong> {{ result.url }} <br />
                    <strong>Status:</strong> {{ result.status }} <br />
                    <strong>Data:</strong> {{ result.data ? result.data : 'N/A' }} <br />
                </li>
            </ul>
        </div>
        <div v-if="errors" class="errors">
            <h2>Errors:</h2>
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
    import { onMounted, ref, watch } from 'vue'
    import { io } from "socket.io-client"
    import { useRoute } from 'vue-router'
    import axios from 'axios'

    const results = ref([])  // Reactive state for successfull crawl results
    const errors = ref([])  // Reactive state for failed crawl results
    const socket = ref(null)    // Ref from the socket instance
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
        socket.value = io("http://localhost:3002")

        // Fetch the crawl data
        try {
            const response = await axios.get(`http://localhost:3001/api/getcrawler/${crawlId.value}`);
            crawl.value = response.data; // Assign response data to the crawl object
        } catch (error) {
            errorMessage.value = error.response ? error.response.data.message : 'Error fetching data';
        }
        
        // Join the room for the specific crawl ID
        socket.value.emit('joinCrawl', crawlId.value)
        // Listen for crawl completion
        socket.value.on("crawlCompleted", (data) => {
            console.log('crawl completed')
            results.value.push({
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
    })
    // Initialize Socket.io connection on component mount
    onMounted(() => {

    })
</script>

