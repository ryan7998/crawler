<template>
    <div class="space-y-2">
        <label :for="'url-input-' + index" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Url</label>
        <div class="flex space-x-2">
            <input 
                v-model="localUrl" 
                type="url" 
                :id="'url-input-' + index" 
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                placeholder="Enter Url" />
            <button :disabled="!localUrl.length" 
                @click="testUrl" 
                type="button" 
                class="text-white bg-green-700 font-medium rounded-lg text-xs px-3 py-2 hover:bg-green-800 focus:ring-4 focus:ring-green-300 focus:outline-none"
            >Test</button>
        </div>
        <CssSelector v-for="(selector, id) in localSelectors" :key="id" :index="id" :selector="selector"  @removeSelector="removeSelectorHandler(id)" @updateSelector="updateSelectorHandler" />
        <button 
            type="button" 
            class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-small rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            @click="addSelector"
        >+ Selector</button>
        <SlideOver v-if="openSlide" @close-slide-over="onCloseSlideOver">
            <template v-slot:title>
                {{ localUrl }}
            </template>
            <template #default>
                <pre>{{ crawledData }}</pre>
            </template>
        </SlideOver>
    </div>
</template>
<script setup>
    import { ref, reactive, watch, toRef } from 'vue'
    import axios from 'axios'
    import CssSelector from './CssSelector.vue'
    import SlideOver from './SlideOver.vue'

    // Define props with structure
    const props = defineProps({
        urlData: {
            type: Object,
            required: true,
            validator: (value) => {
                return 'url' in value && 'selectors' in value && Array.isArray(value.selectors)
            }
        },
        index: {
            type: Number,
            required: true
        }
    })

    const emit = defineEmits(['updateUrlData'])

    // Local reactive state
    const localUrl = ref(props.urlData.url || '')
    const localSelectors = ref([ ...props.urlData.selectors ] || [])

    // Use toRef to make urlData reactive
    // const url = toRef(props.urlData, 'url')
    // const selectors = toRef(props.urlData, 'selectors')

    const openSlide = ref(false)
    const crawledData = ref()

    // Watchers to emit updates to parent
    watch(localUrl, (newUrl) =>{
        emit('updateUrlData', { index: props.index, key: 'url', value: newUrl })
    })

    watch(localSelectors, (newSelectors) => {
        console.log('UrlComponent: ', props.index, newSelectors)
        emit('updateUrlData', {
            index: props.index,
            key: 'selectors',
            value: newSelectors
        }, { deep: true })
    })
    
    // Add new selector
    const addSelector = () => {
        selectors.value.push({
            name: '',
            css: ''
        })
    }

    // Remove current selector
    const removeSelectorHandler = (id) => {
        // selectors.value = selectors.value.filter((x, id) => id !== val)
        localSelectors.value.splice(id, 1)
    }

    // Update selector based on emitted event from CssSelector
    const updateSelectorHandler = ({ index, selector }) => {
        if (index >= 0 && index < localSelectors.value.length) {
            localSelectors.value[index] = selector
        }
    }

    const testUrl = async () => {
        try {
            const requestBody = {
                urls: localUrl.value,
                selectors: localSelectors.value || []
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