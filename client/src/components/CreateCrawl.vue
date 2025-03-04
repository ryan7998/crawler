<template>
    <form @submit.prevent="handleSubmit" class="max-w-xl mx-auto py-8">
        <!-- Crawl Title Input -->
        <div class="mb-5">
            <label for="title" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Crawl Title</label>
            <input 
                v-model="formState.title" 
                type="text" 
                id="title" 
                class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                placeholder="Enter the crawl name" 
                required 
            />
            <p v-if="errors.title" class="text-red-500 text-sm mt-1">{{ errors.title }}</p>
        </div>
        
        <!-- URLs and Selectors -->
        <div class="mb-5 space-y-2">
            <UrlComponent 
                v-for="(urlData, index) in formState.urls"
                :key="urlData.id" 
                :urlData="urlData" 
                :index="index" 
                @updateUrlData="updateUrlData"
                @removeUrlData="removeUrlData"
            />
            <button 
                type="button" 
                @click="addUrl" 
                class="flex text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
            >
                + Add Url
            </button>
        </div>
        
        <!-- Submission Buttons -->
        <div class="mb-5">
            <button 
                type="submit" 
                class="flex text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-3 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800"
            >
                {{ isEditing ? 'Update Crawl' : 'Save' }}
            </button>
        </div>
        
        <!-- Success and Error Messages -->
        <div v-if="successMessage" class="text-green-500 mb-4">
            {{ successMessage }}
        </div>
        <div v-if="submitError" class="text-red-500 mb-4">
            {{ submitError }}
        </div>
    </form>
</template>

<script setup>
    import { ref, reactive, onMounted, computed } from 'vue'
    import axios from 'axios'
    import UrlComponent from './UrlComponent.vue'
    import { useCrawlStore } from '../stores/crawlStore'
    import { useRouter } from 'vue-router'

    const crawlStore = useCrawlStore()
    const router = useRouter()

    // Reactive form state
    const formState = reactive({
        title: '',
        urls: []
    })

    // Reactive error messages
    const errors = reactive({
        title: '',
        urls: []
    })

    // Success and submission error messages
    const successMessage = ref('')
    const submitError = ref('')

    // Determine if editing based on the store's currentCrawl
    const isEditing = computed(() => !!crawlStore.currentCrawl?. _id)

    // Initialize form state based on the store's currentCrawl
    const initializeForm = () => {
        if (isEditing.value) {
            formState.title = crawlStore.currentCrawl.title
            // Deep clone to prevent direct mutations
            formState.urls = crawlStore.currentCrawl.urls.map(url => ({
                id: url.id || '',
                url: url.url || '',
                selectors: url.selectors ? [...url.selectors] : []
            }))
            // Initialize errors for existing URLs
            formState.urls.forEach((url, index) => {
                errors.urls[index] = {}
            })
        } else {
            // Initialize with one empty URL entry
            addUrl()
        }
    }

    onMounted(() => {
        initializeForm()
    })

    // Add a new URL entry
    const addUrl = () => {
        formState.urls.push({
            id: Math.random().toString(36).substring(2, 9),
            url: '',
            selectors: []
        })
        errors.urls.push({})
    }

    // Handle updates from UrlComponent.vue
    const updateUrlData = ({ index, key, value }) => {
        if (key === 'url') {
            formState.urls[index].url = value
            // Basic validation
            if (!value) {
                errors.urls[index].url = 'URL is required.'
            } else if (!isValidUrl(value)) {
                errors.urls[index].url = 'Please enter a valid URL.'
            } else {
                errors.urls[index].url = ''
            }
        } else if (key === 'selectors') {
            formState.urls[index].selectors = value
        }
    }

    const removeUrlData = ({ index }) => {
        console.log('index: ', index)
        formState.urls.splice(index, 1)
    }

    // Validate URL format
    const isValidUrl = (url) => {
        const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,})'+ // domain name
            '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-zA-Z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-zA-Z\\d_]*)?$','i') // fragment locator
        return !!pattern.test(url)
    }

    // Handle form submission
    const handleSubmit = async () => {
        // Reset messages
        successMessage.value = ''
        submitError.value = ''

        // Validate the entire form
        let isValid = true

        if (!formState.title.trim()) {
            errors.title = 'Title is required.'
            isValid = false
        } else {
            errors.title = ''
        }

        formState.urls.forEach((urlEntry, index) => {
            // Validate URL
            if (!urlEntry.url.trim()) {
                errors.urls[index].url = 'URL is required.'
                isValid = false
            } else if (!isValidUrl(urlEntry.url.trim())) {
                errors.urls[index].url = 'Please enter a valid URL.'
                isValid = false
            } else {
                errors.urls[index].url = ''
            }

            // Validate selectors
            // if (!urlEntry.selectors.length) {
            //     errors.urls[index].selectors = 'At least one selector is required.'
            //     isValid = false
            // } else {
            //     errors.urls[index].selectors = ''
            // }
        })

        if (!isValid) {
            submitError.value = 'Please fix the errors above before submitting.'
            return
        }

        // Prepare data to send
        const requestData = {
            title: formState.title.trim(),
            urls: formState.urls.map(url => ({
                url: url.url.trim(),
                selectors: url.selectors
            })),
            userId: '1' // TODO: Update dynamically with authenticated user's ID
        }

        try {
            let response = null
            if (isEditing.value) {
                // Update existing crawl
                response = await axios.put(`http://localhost:3001/api/updatecrawl/${crawlStore.currentCrawl._id}`, requestData)
                successMessage.value = 'Crawl updated successfully.'
                // Optionally, clear the store
                // crawlStore.clearData()
                // Navigate to the updated crawl's dashboard
                router.push(`/dashboard/${crawlStore.currentCrawl._id}`)
            } else {
                // Create a new crawl
                response = await axios.post('http://localhost:3001/api/createcrawler', requestData)
                successMessage.value = 'Crawl created successfully.'
                // Navigate to the new crawl's dashboard
                router.push(`/dashboard/${response.data.crawlId}`)
            }
            console.log('Crawl created/updated:', response.data)
        } catch (error) {
            console.error('Error creating/updating crawl:', error.response?.data?.message || error.message)
            submitError.value = error.response?.data?.message || 'An error occurred while submitting the form.'
        }
    }
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
