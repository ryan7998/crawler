<template>
    <v-dialog v-model="dialog" max-width="800px">
        <v-card>
            <v-card-title class="text-h5">
                {{ isEditing ? 'Edit Crawl' : 'Create New Crawl' }}
            </v-card-title>

            <v-card-text>
                <v-stepper v-model="currentStep">
                    <v-stepper-header>
                        <v-stepper-item
                            :value="1"
                            title="Basic Info"
                        >
                            <template v-slot:icon>
                                <v-icon>mdi-text-box</v-icon>
                            </template>
                        </v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item
                            :value="2"
                            title="URLs"
                        >
                            <template v-slot:icon>
                                <v-icon>mdi-link</v-icon>
                            </template>
                        </v-stepper-item>
                        <v-divider></v-divider>
                        <v-stepper-item
                            :value="3"
                            title="Domain Check"
                        >
                            <template v-slot:icon>
                                <v-icon>mdi-domain</v-icon>
                            </template>
                        </v-stepper-item>
                    </v-stepper-header>

                    <v-stepper-window>
                        <v-stepper-window-item :value="1">
                            <v-form ref="form" @submit.prevent>
                                <v-text-field
                                    v-model="title"
                                    label="Crawl Title"
                                    :rules="[v => !!v || 'Title is required']"
                                    required
                                ></v-text-field>
                            </v-form>
                        </v-stepper-window-item>

                        <v-stepper-window-item :value="2">
                            <v-form @submit.prevent>
                                <v-textarea
                                    v-model="urlsText"
                                    label="URLs"
                                    hint="Enter URLs separated by spaces or new lines"
                                    persistent-hint
                                    rows="5"
                                    :rules="[
                                        v => {
                                            const urls = parseUrls(v);
                                            if (urls.length === 0) return 'Please enter at least one URL';
                                            const invalidUrls = urls.filter(url => !isValidUrl(url));
                                            if (invalidUrls.length > 0) {
                                                return `Invalid URL(s): ${invalidUrls.join(', ')}`;
                                            }
                                            return true;
                                        }
                                    ]"
                                    required
                                ></v-textarea>
                            </v-form>
                        </v-stepper-window-item>

                        <v-stepper-window-item :value="3">
                            <!-- Current Selectors Section -->
                            <div class="flex flex-col gap-4">
                                <div>
                                    <h6 class="text-gray-700 font-semibold mb-4">Current Selectors</h6>
                                    <div class="space-y-4">
                                        <CssSelector 
                                            v-for="selector in currentSelectors" 
                                            :key="selector.id" 
                                            :selector="selector"
                                            @removeSelector="removeCurrentSelectorHandler"
                                            @updateSelector="updateCurrentSelectorHandler"
                                        />
                                        <v-btn
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            @click="currentSelectors.push({
                                                id: Math.random().toString(36).substring(2, 9),
                                                name: '',
                                                css: ''
                                            })"
                                        >
                                            Add New Selector
                                        </v-btn>
                                    </div>
                                </div>
                            <div v-if="domainLoading" class="d-flex justify-center align-center py-4">
                                <v-progress-circular
                                    indeterminate
                                    color="primary"
                                    size="64"
                                ></v-progress-circular>
                            </div>
                            <div v-else class="mt-4">
                                <v-alert
                                    v-if="domainError"
                                    type="error"
                                    class="mb-4"
                                >
                                    {{ domainError }}
                                </v-alert>
                                <v-alert
                                    v-if="domainInfo"
                                    :type="domainInfo.hasSelectors ? 'success' : 'warning'"
                                    class="mb-4"
                                >
                                    <div class="d-flex align-center">
                                        <div>
                                            <div class="font-weight-bold">Domain: {{ domainInfo.domain }}</div>
                                            <div v-if="domainInfo.hasSelectors">
                                                Default selectors found for this domain
                                            </div>
                                            <div v-else>
                                                No default selectors found for this domain
                                            </div>
                                        </div>
                                    </div>
                                </v-alert>
                                    <!-- Domain Selectors Section -->
                                    <div v-if="domainInfo?.hasSelectors" class="mt-6">
                                        <h6 class="text-gray-700 font-semibold mb-4">Default Selectors for {{ domainInfo.domain }}</h6>
                                        <div class="space-y-4">
                                            <div v-for="selector in localSelectors" :key="selector.id" class="flex items-center space-x-4">
                                                <CssSelector 
                                                    :selector="selector"
                                                    :showRemoveButton="false"
                                                    @updateSelector="updateDomainSelectorHandler"
                                                />
                                                <v-btn
                                                    variant="text"
                                                    color="primary"
                                                    size="small"
                                                    @click="addDomainSelectorToCurrent(selector)"
                                                >
                                                    Add to Current
                                                </v-btn>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </v-stepper-window-item>
                    </v-stepper-window>
                </v-stepper>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="error"
                    variant="text"
                    @click="closeDialog"
                >
                    Cancel
                </v-btn>
                <v-btn
                    v-if="currentStep > 1"
                    color="primary"
                    variant="text"
                    @click="handleBack"
                >
                    Back
                </v-btn>
                <v-btn
                    v-if="currentStep < 3"
                    color="primary"
                    variant="text"
                    @click="handleNext"
                >
                    Next
                </v-btn>
                <v-btn
                    v-else
                    color="primary"
                    variant="text"
                    @click="handleSubmit"
                    :loading="loading"
                    :disabled="!!domainError"
                >
                    {{ isEditing ? 'Update' : 'Create' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import CssSelector from './CssSelector.vue'

const props = defineProps({
    modelValue: Boolean,
    crawlData: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'crawl-created', 'error'])

// Computed properties
const dialog = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.crawlData)
const apiUrl = computed(() => import.meta.env.VITE_BASE_URL || 'http://localhost:3001')

// Refs
const router = useRouter()
const form = ref(null)
const currentStep = ref(1)
const title = ref('')
const urlsText = ref('')
const loading = ref(false)
const domainLoading = ref(false)
const domainError = ref('')
const domainInfo = ref(null)

// Add new refs for selectors
const localSelectors = ref([])
const currentSelectors = ref([])

// Inject the notification function
const showNotification = inject('showNotification')

// Initialize form
const initializeForm = () => {
    if (props.crawlData) {
        title.value = props.crawlData.title
        urlsText.value = props.crawlData.urls.join('\n')
        // Initialize current selectors from crawlData with child selectors
        currentSelectors.value = props.crawlData.selectors?.map(selector => ({
            id: Math.random().toString(36).substring(2, 9),
            name: selector.target_element,
            css: selector.selector_value,
            type: selector.type || 'text',
            attribute: selector.attribute || null,
            childSelectors: (selector.childSelectors || []).map(child => ({
                id: Math.random().toString(36).substring(2, 9),
                name: child.target_element,
                selector: child.selector_value,
                type: child.type || 'text',
                attribute: child.attribute || null
            }))
        })) || []
    } else {
        title.value = ''
        urlsText.value = ''
        currentSelectors.value = []
    }
}

// Watch for changes in crawlData
watch(() => props.crawlData, (newVal) => {
    initializeForm()
}, { immediate: true })

// Watch for dialog changes
watch(() => dialog.value, (newVal) => {
    if (newVal) {
        initializeForm()
    }
})

// URL validation
const isValidUrl = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

// Parse URLs from text
const parseUrls = (text) => {
    return text
        .split(/[\s\n]+/)
        .map(url => url.trim())
        .filter(url => url.length > 0)
}

// Extract domain from URL
const extractDomain = (url) => {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname // This will preserve www if present
    } catch {
        return null
    }
}

// Check if all URLs have the same domain
const checkDomainConsistency = (urls) => {
    const domains = urls.map(url => extractDomain(url)).filter(Boolean)
    if (domains.length === 0) return null
    
    const firstDomain = domains[0]
    const allSameDomain = domains.every(domain => domain === firstDomain)
    
    return allSameDomain ? firstDomain : null
}

// Fetch domain selectors
const fetchDomainSelectors = async (domain) => {
    try {
        const response = await axios.get(`${apiUrl.value}/api/selectors/${domain}`)
        // Transform the selectors to match the CssSelector component format
        const transformedSelectors = response.data.selectors.map(selector => ({
            id: Math.random().toString(36).substring(2, 9),
            name: selector.target_element,
            css: selector.selector_value
        }))
        localSelectors.value = transformedSelectors
        return {
            domain,
            hasSelectors: true,
            selectors: transformedSelectors
        }
    } catch (error) {
        if (error.response?.status === 404) {
            localSelectors.value = []
            return {
                domain,
                hasSelectors: false,
                selectors: null
            }
        }
        throw error
    }
}

// Add selector update handlers
const updateCurrentSelectorHandler = ({ selector }) => {
    const index = currentSelectors.value.findIndex(s => s.id === selector.id)
    if (index !== -1) {
        currentSelectors.value[index] = { ...currentSelectors.value[index], ...selector }
    }
}

const updateDomainSelectorHandler = ({ selector }) => {
    const index = localSelectors.value.findIndex(s => s.id === selector.id)
    if (index !== -1) {
        localSelectors.value[index] = { ...localSelectors.value[index], ...selector }
    }
}

// Add selector remove handlers
const removeCurrentSelectorHandler = (selectorId) => {
    currentSelectors.value = currentSelectors.value.filter(s => s.id !== selectorId)
}

const removeDomainSelectorHandler = (selectorId) => {
    localSelectors.value = localSelectors.value.filter(s => s.id !== selectorId)
}

// Add function to add domain selector to current selectors
const addDomainSelectorToCurrent = (selector) => {
    // Check if selector already exists in current selectors
    const exists = currentSelectors.value.some(s => 
        s.name === selector.name && s.css === selector.css
    )
    if (!exists) {
        currentSelectors.value.push({
            id: Math.random().toString(36).substring(2, 9),
            name: selector.name,
            css: selector.css
        })
    }
}

// Add validation function for selectors
const validateSelectors = () => {
    if (currentSelectors.value.length === 0) {
        showNotification('Please add at least one selector', 'error')
        return false
    }

    const emptySelectors = currentSelectors.value.filter(selector => 
        !selector.name.trim() || !selector.css.trim()
    )

    if (emptySelectors.length > 0) {
        showNotification('Please fill in all selector fields', 'error')
        return false
    }

    return true
}

// Handle next step
const handleNext = async () => {
    if (currentStep.value === 1) {
        const { valid } = await form.value.validate()
        if (!valid) {
            showNotification('Please enter a title', 'error')
            return
        }
        currentStep.value++
    } else if (currentStep.value === 2) {
        const urls = parseUrls(urlsText.value)
        if (urls.length === 0) {
            showNotification('Please enter at least one URL', 'error')
            return
        }

        const invalidUrls = urls.filter(url => !isValidUrl(url))
        if (invalidUrls.length > 0) {
            showNotification('Please enter valid URLs', 'error')
            return
        }

        domainLoading.value = true
        domainError.value = ''
        domainInfo.value = null

        try {
            const domain = checkDomainConsistency(urls)
            if (!domain) {
                domainError.value = 'All URLs must be from the same domain'
                return
            }

            currentStep.value++
            domainInfo.value = await fetchDomainSelectors(domain)
        } catch (error) {
            console.error('Error checking domain:', error)
            domainError.value = 'Error checking domain selectors'
        } finally {
            domainLoading.value = false
        }
    }
}

// Handle back step
const handleBack = () => {
    currentStep.value--
    if (currentStep.value === 2) {
        domainError.value = ''
        domainInfo.value = null
    }
}

// Handle form submission
const handleSubmit = async () => {
    const urls = parseUrls(urlsText.value)
    
    if (urls.length === 0) {
        showNotification('Please enter at least one URL', 'error')
        return
    }

    const invalidUrls = urls.filter(url => !isValidUrl(url))
    if (invalidUrls.length > 0) {
        showNotification('Please enter valid URLs', 'error')
        return
    }

    if (domainError.value) {
        return
    }

    if (!validateSelectors()) {
        return
    }

    loading.value = true

    try {
        const requestData = {
            title: title.value.trim(),
            urls: urls.map(url => url.trim()),
            selectors: currentSelectors.value.map(selector => ({
                target_element: selector.name,
                selector_value: selector.css,
                type: selector.type || 'text',
                attribute: selector.attribute,
                childSelectors: selector.childSelectors?.map(child => ({
                    target_element: child.name,
                    selector_value: child.selector,
                    type: child.type || 'text',
                    attribute: child.attribute
                })) || []
            })),
            userId: '1'
        }

        const response = isEditing.value
            ? await axios.put(`${apiUrl.value}/api/updatecrawl/${props.crawlData._id}`, requestData)
            : await axios.post(`${apiUrl.value}/api/createcrawler`, requestData)
        
        showNotification(isEditing.value ? 'Crawl updated successfully' : 'Crawl created successfully', 'success')
        emit('crawl-created', isEditing.value ? response.data.crawl : { _id: response.data.crawlId })
        closeDialog()
    } catch (error) {
        console.error('Error creating/updating crawl:', error)
        showNotification(error.response?.data?.message || 'An error occurred', 'error')
    } finally {
        loading.value = false
    }
}

// Close dialog
const closeDialog = () => {
    dialog.value = false
    title.value = ''
    urlsText.value = ''
    currentStep.value = 1
    domainError.value = ''
    domainInfo.value = null
}
</script> 