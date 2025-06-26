<template>
    <div class="space-y-2">
        <label :for="'url-input-' + index" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Url</label>
        <div class="flex space-x-2">
            <input 
                v-model="localUrl"
                required
                type="url" 
                :id="'url-input-' + index" 
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                placeholder="Enter Url" />
            <button 
                @click="removeUrl"
                type="button" 
                class="text-white bg-red-700 font-medium rounded-lg text-xs px-3 py-2 hover:bg-red-800 focus:ring-4 focus:ring-red-300 focus:outline-none"
            >Remove</button>
            <button :disabled="!localUrl.length" 
                @click="testUrl" 
                type="button" 
                class="text-white bg-green-700 font-medium rounded-lg text-xs px-3 py-2 hover:bg-green-800 focus:ring-4 focus:ring-green-300 focus:outline-none"
            >Test</button>
        </div>
        <label class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Selectors</label>
        <CssSelector v-for="(selector, index) in localSelectors" :key="selector.id" :index="index" :selector="selector"  @removeSelector="removeSelectorHandler(selector.id)" @updateSelector="updateSelectorHandler" />
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
                <pre>{{ crawledData || 'Crawl Failed'}}</pre>
            </template>
        </SlideOver>
    </div>
</template>
<script setup>
    import { ref, reactive, watch, toRef } from 'vue'
    import axios from 'axios'
    import CssSelector from './CssSelector.vue'
    import SlideOver from './SlideOver.vue'
    import { getApiUrl } from '../utils/commonUtils'

    const props = defineProps({
        modelValue: {
            type: String,
            default: ''
        },
        selectors: {
            type: Array,
            default: () => []
        },
        index: {
            type: Number,
            required: true
        }
    })

    const emit = defineEmits(['update:modelValue', 'update:selectors', 'removeUrlData'])

    const apiUrl = getApiUrl()

    // Local reactive state
    const localUrl = ref(props.modelValue || '')
    const localSelectors = reactive([ ...props.selectors ] || [])
    const openSlide = ref(false)
    const crawledData = ref()

    // Watchers to emit updates to parent
    watch(localUrl, (newUrl) =>{
        emit('update:modelValue', newUrl)
    })

    watch(localSelectors, (newSelectors) => {
        emit('update:selectors', newSelectors)
    })
    
    // Add new selector
    const addSelector = () => {
        localSelectors.push({
            id: Math.random().toString(36).substring(2, 9),
            name: '',
            css: ''
        })
    }

    // Remove current selector
    const removeSelectorHandler = (val) => {
        localSelectors.splice(localSelectors.findIndex(s => s.id === val), 1)
    }

    // Update selector based on emitted event from CssSelector
    const updateSelectorHandler = ({ selector }) => {
            let index = localSelectors.findIndex(s => s.id === selector.id)
            localSelectors[index] = { ...localSelectors[index], ...selector }
    }

    const testUrl = async () => {
        try {
            const requestBody = {
                urls: localUrl.value,
                selectors: localSelectors || []
            }
            // Make a POST request to start the crawl
            const { data } = await axios.post(`${apiUrl}/api/startcrawl`, requestBody)
            crawledData.value = data?.extractedDatum
            console.log('Crawl started: ', data)
            // crawl.value.status = 'in-progress'
        } catch (error) {
            console.log('Error starting crawl: ', error.response ?  error.response.data.message : error.message)
        }
        openSlide.value = true
    }

    const onCloseSlideOver = () => {
        openSlide.value = false
    }
    
    const removeUrl = () => {
        emit('removeUrlData', { index: props.index })
    }
</script>