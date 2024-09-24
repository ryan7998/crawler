<template>
    <div class="space-y-2">
        <label for="url" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Url</label>
        <div class="flex space-x-2">
            <input v-model="url" type="text" id="url" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Url" />
            <button :disabled="!url.length" @click="testUrl" type="button" class="text-white bg-green-700 font-medium rounded-lg text-xs px-3 py-2 hover:bg-green-800 focus:ring-4 focus:ring-green-300 focus:outline-none">Test</button>
        </div>
        <CssSelector v-for="selector in urlData.selectors" :key="selector.index" @remove-selector="removeSelectorHandler" :selector="selector"/>
        <button type="button" class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-small rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            @click="addSelector"
        >+ Selector</button>
        <SlideOver v-if="openSlide" @close-slide-over="onCloseSlideOver">
            <template v-slot:title>
                {{ url }}
            </template>
            <template #default>
                <pre>{{ crawledData }}</pre>
            </template>
        </SlideOver>
    </div>
</template>
<script setup>
    import { onMounted, ref, toRef } from 'vue'
    import axios from 'axios'
    import CssSelector from './CssSelector.vue'
    import SlideOver from './SlideOver.vue'

    // const socket = ref(io("http://localhost:3002"))    // Ref from the socket instance
    const props = defineProps({
        urlData: Object
    })
    const url = toRef(props.urlData, 'url')
    const selectors = toRef(props.urlData, 'selectors')
    const count = ref(0)
    const openSlide = ref(false)
    const crawledData = ref()
    
    // Add new selector
    const addSelector = () => {
        count.value++
        selectors.value.push({
            index: count.value,
            name: null,
            css: null
        })
    }

    // Remove current selector
    const removeSelectorHandler = (val) => {
        selectors.value = selectors.value.filter(x => x.index !== val)
    }

    const testUrl = async () => {
        try {
            const requestBody = {
                urls: url.value,
                selectors: selectors.value || []
            }
            // Make a POST request to start the crawl
            const { data } = await axios.post('http://localhost:3001/api/startcrawl', requestBody)
            crawledData.value = data?.extractedDatum
            console.log('Crawl started: ', data)
            // crawl.value.status = 'in-progress'
        } catch (error) {
            console.log('Error starting crawl: ', error.response ?  error.data.message : error.message)
        }
        openSlide.value = true

    }

    const onCloseSlideOver = () => {
        openSlide.value = false
    }
</script>