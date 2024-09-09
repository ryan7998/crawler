<template>
    <div>
        <h1>Crawler Dashboard</h1>
        <div class="results">
            <h2>Crawl Results</h2>
            <ul>
                <li v-for="(result, index) in results" :key="index">
                    <strong>URL:</strong> {{ result.url }} <br />
                    <strong>Status:</strong> {{ result.status }} <br />
                    <strong>Data:</strong> {{ result.data ? result.data : 'N/A' }} <br />
                </li>
            </ul>
        </div>

    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue'
    import { io } from "socket.io-client"

    const results = ref([])  // Reactive state for successfull crawl results
    const errors = ref([])  // Reactive state for failed crawl results
    const socket = ref(null)    // Ref from the socket instance

    // Initialize Socket.io connection on component mount
    onMounted(() => {
        socket.value = io("http://localhost:3002")

        // Listen for crawl completion
        socket.value.on("crawlCompleted", (data) => {
            console.log('crawl completed')
            results.value.push({
                url: data.url,
                status: "completed",
                data: data.resultm
            })
        })
    })
    

</script>


<style scoped>

</style>
