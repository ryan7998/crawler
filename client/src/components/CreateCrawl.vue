<template>
    <form class="max-w-xl mx-auto py-8" @submit.prevent="handleSubmit">
        <div class="mb-5">
            <label for="title" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Crawl Title</label>
            <input v-model="formState.title" type="title" id="title" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter the crawl name" required />
        </div>
        
        <div class="mb-5 space-y-2">
            <UrlComponent v-for="(urlData, id) in formState.urls" :key="id" :urlData="urlData" />
            <button type="button" @click="addUrl" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >Add Url</button>
            <button v-if="crawlStore.crawl._id" type="submit" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-3 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >Update Crawl</button>
            <button v-else type="submit" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-3 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >Save</button>
        </div>
    </form>
</template>
<script setup>
    import axios from 'axios'
    import { useCrawlStore } from '../stores/crawlStore'
    import { ref, reactive, onMounted, computed } from 'vue'
    import router from '../router';
    // import CssSelector from './CssSelector.vue'
    import UrlComponent from './UrlComponent.vue'

    const crawlStore = useCrawlStore()

    const formState = reactive({
        title: '',
        urls: []
    })
    
    const addUrl = () => {
        formState.urls.push({
            url: '',
            selectors: []
        })
    }

    onMounted(() => {
        if(crawlStore.crawl?._id){
            formState.title = crawlStore.crawl.title
            formState.urls = crawlStore.crawl.urls
        }
    })

    const handleSubmit = async () => {
        
        // Prepare the URLs by splitting on spaces or new lines and trimming them
        // const urlArray = [... new Set(formState.urls // Get unique urls only
        //     .split(/\s+/)
        //     .map((url) => url.trim())
        //     .filter((url) => url) // Rmove empty string
        // )]

        // Prepare data to send
        const requestData = {
            title: formState.title,
            urls: formState.urls,
            userId: '1' // TODO: update dynamically
        }

        try {
            // Send POST or PUT request
            let response = null
            if (crawlStore.crawl._id) {
                response = await axios.put(`http://localhost:3001/api/updatecrawl/${crawlStore.crawl._id}`, requestData)
                router.push(`/dashboard/${crawlStore.crawl._id}`)
            } else {
                response = await axios.post('http://localhost:3001/api/createcrawler', requestData)
                router.push(`/dashboard/${response.data.crawlId}`)
            }
            console.log('Crawl created/updated: ', response.data)
        } catch (error) {
            console.log('Error creating crawl: ', error.response ? error.response.data : error.message)
        }
        console.log(requestData)
    
    }
</script>