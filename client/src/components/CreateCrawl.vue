<template>
    <form class="max-w-xl mx-auto py-8" @submit.prevent="handleSubmit">
    <div class="mb-5">
        <label for="title" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Crawl Title</label>
        <input v-model="formState.title" type="title" id="title" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter the crawl name" required />
    </div>
    <div class="mb-5">
        <label for="urls" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Urls</label>
        <textarea v-model="formState.urls" type="urls" id="urls" rows="4" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter list of URLs separated by spaces or new lines" required />
    </div>
    <div class="mb-5 space-y-2">
        <CssSelector v-for="selector in selectors" :key="selector.index" @remove-selector="removeSelectorHandler" :selector="selector"/>
        
        <button type="button" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-small rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            @click="addSelector"
        >Add Selector</button>
        <button type="submit" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
           
        >Submit</button>

    </div>

    </form>
</template>
<script setup>
    import axios from 'axios'
    import CssSelector from './CssSelector.vue'
    import { ref, reactive } from 'vue'
import router from '../router';

    const formState = reactive({
        title: null,
        urls: null,
        selectors: {}
    })
    const selectors = ref([])
    const count = ref(0)


    const addSelector = () => {
        count.value++
        selectors.value.push({
            index: count.value,
            name: null,
            css: null
        })
    }

    const removeSelectorHandler = (val) => {
        selectors.value = selectors.value.filter(x => x.index !== val)
    }

    const handleSubmit = async () => {
        
        // Prepare the URLs by splitting on spaces or new lines and trimming them
        const urlArray = [... new Set(formState.urls // Get unique urls only
            .split(/\s+/)
            .map((url) => url.trim())
            .filter((url) => url) // Rmove empty string
        )]

        // Prepare data to send
        const requestData = {
            title: formState.title,
            urls: urlArray,
            selectors: selectors.value,
            userId: '1' // TODO: update dynamically
        }

        try {
            // Send POST request
            const response = await axios.post('http://localhost:3001/api/createcrawler', requestData)
            console.log('Crawl created: ', response.data)
            router.push(`/dashboard/${response.data.crawlId}`)
        } catch (error) {
            console.log('Error creating crawl: ', error.response ? error.response.data : error.message)
        }
        console.log(requestData)
    
    }
</script>