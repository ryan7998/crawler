<template>
    <!-- Main Content -->
    <div class="container mx-auto px-4 mt-8">
        <div class="flex space-x-4">

            <!-- Sidebar Actions -->
            <div class="w-1/4 space-y-2">
                <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
                    <h6 class="font-semibold text-gray-700 mb-4">Crawl Stats</h6>
                    <v-list>
                        <v-list-item>
                            <template v-slot:prepend>
                                <v-icon icon="mdi-text-box-outline" />
                            </template>
                            <v-list-item-title>Name</v-list-item-title>
                            <v-list-item-subtitle>{{ crawl.title }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:prepend>
                                <v-icon icon="mdi-identifier" />
                            </template>
                            <v-list-item-title>Crawl Id</v-list-item-title>
                            <v-list-item-subtitle>{{ crawlId }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:prepend>
                                <v-icon icon="mdi-information-outline" />
                            </template>
                            <v-list-item-title>Status</v-list-item-title>
                            <v-list-item-subtitle>
                                <v-chip
                                    :color="getStatusColor(crawl.status)"
                                    size="small"
                                    class="text-capitalize"
                                >
                                    {{ crawl.status }}
                                </v-chip>
                            </v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:prepend>
                                <v-icon icon="mdi-clock-start" />
                            </template>
                            <v-list-item-title>Start Time</v-list-item-title>
                            <v-list-item-subtitle>{{ formatDateTime(crawl.startTime) }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item>
                            <template v-slot:prepend>
                                <v-icon icon="mdi-clock-end" />
                            </template>
                            <v-list-item-title>End Time</v-list-item-title>
                            <v-list-item-subtitle>{{ formatDateTime(crawl.endTime) }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </div>
                <div class="bg-white rounded-lg shadow-sm p-6">
                    <h6 class="font-semibold text-gray-700 mb-4">Actions</h6>
                    <v-btn
                        block
                        variant="outlined"
                        color="primary"
                        class="mb-2"
                        @click="configureCrawl"
                    >
                        <v-icon start icon="mdi-cog" />
                        Configure
                    </v-btn>
                    <v-btn
                        block
                        variant="outlined"
                        color="warning"
                        class="mb-2"
                        @click="confirmDeleteCrawlData"
                        :disabled="!hasCrawlData"
                    >
                        <v-icon start icon="mdi-delete-sweep" />
                        Clear Data
                    </v-btn>
                    <v-btn
                        block
                        variant="outlined"
                        color="error"
                        class="mb-2"
                        @click="confirmDelete"
                    >
                        <v-icon start icon="mdi-delete" />
                        Delete Crawl
                    </v-btn>
                    <v-btn
                        block
                        variant="outlined"
                        color="info"
                        @click="startCrawl"
                    >
                        <v-icon start icon="mdi-restart" />
                        {{ crawl?.status === 'pending' ? 'Start' : 'Restart' }}
                    </v-btn>
                </div>
            </div>

            <!-- Crawl Summary and Details -->
            <div class="w-3/4">
                <!-- Crawl Details -->
                <div v-if="crawl" class="bg-white rounded-lg shadow-sm p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h6 class="text-gray-700 font-semibold">Crawl Details</h6>
                        <div class="flex items-center space-x-4">
                            <!-- Bulk Delete Button -->
                            <v-btn
                                v-if="selectedUrls.length > 0"
                                variant="outlined"
                                color="warning"
                                size="small"
                                @click="confirmBulkDelete"
                            >
                                <v-icon start icon="mdi-delete-sweep" />
                                Clear Selected ({{ selectedUrls.length }})
                            </v-btn>
                            <!-- Queue Status -->
                            <div class="text-sm text-gray-600">
                                <span v-if="queueStatus.total > 0">
                                    Queue: {{ queueStatus.active }} active, {{ queueStatus.waiting }} waiting
                                </span>
                            </div>
                            <!-- Export Button -->
                            <div class="relative">
                                <v-btn
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    @click="showExportMenu = true"
                                >
                                    <v-icon start icon="mdi-download" />
                                    Export
                                </v-btn>
                                <v-menu
                                    v-model="showExportMenu"
                                    :close-on-content-click="false"
                                    location="bottom end"
                                >
                                    <v-card min-width="200">
                                        <v-list>
                                            <v-list-item @click="exportToCSV">
                                                <template v-slot:prepend>
                                                    <v-icon icon="mdi-file-delimited" />
                                                </template>
                                                <v-list-item-title>Export as CSV</v-list-item-title>
                                            </v-list-item>
                                            <v-list-item @click="exportToExcel">
                                                <template v-slot:prepend>
                                                    <v-icon icon="mdi-microsoft-excel" />
                                                </template>
                                                <v-list-item-title>Export as Excel</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-card>
                                </v-menu>
                            </div>
                        </div>
                    </div>
                    <v-table>
                        <thead>
                            <tr>
                                <th>
                                    <v-checkbox
                                        v-model="selectAll"
                                        @change="toggleSelectAll"
                                        hide-details
                                    />
                                </th>
                                <th>URL</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="url in crawl.urls" :key="url">
                                <td>
                                    <v-checkbox
                                        v-model="selectedUrls"
                                        :value="url"
                                        hide-details
                                    />
                                </td>
                                <td>
                                    {{ excerpts[url]?.excerpt || url }}
                                    <v-btn
                                        v-if="url.length > 30"
                                        variant="text"
                                        size="small"
                                        @click="excerpts[url]?.toggleExpand"
                                    >
                                        {{ excerpts[url]?.isExpanded ? 'Read less' : 'Read more' }}
                                    </v-btn>
                                </td>
                                <td>
                                    <v-progress-circular
                                        v-if="liveStatusDictionary?.[url] === 'started'"
                                        indeterminate
                                        color="primary"
                                    />
                                    <v-chip
                                        v-else-if="liveStatusDictionary[url] || crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.status"
                                        :color="getStatusColor(liveStatusDictionary[url] || crawl.aggregatedData[url][crawl.aggregatedData[url].length - 1]?.status)"
                                        size="small"
                                    >
                                        {{ liveStatusDictionary[url] || crawl.aggregatedData[url][crawl.aggregatedData[url].length - 1]?.status }}
                                    </v-chip>
                                    <v-chip
                                        v-else
                                        color="info"
                                        size="small"
                                    >
                                        pending
                                    </v-chip>
                                </td>
                                <td>
                                    <v-btn
                                        variant="text"
                                        color="primary"
                                        size="small"
                                        @click="openViewResult(url)"
                                    >
                                        View
                                    </v-btn>
                                    <v-btn
                                        v-if="hasUrlData(url)"
                                        variant="text"
                                        color="warning"
                                        size="small"
                                        @click="confirmDeleteUrlData(url)"
                                    >
                                        Clear
                                    </v-btn>
                                    <SlideOver v-if="viewResults[url]" @close-slide-over="onCloseSlideOver(url)">
                                        <template v-slot:title>
                                            {{ crawl.aggregatedData?.[url]?.[crawl.aggregatedData[url].length - 1]?.data?.defaultData?.title || url }}
                                        </template>
                                        <template #default>
                                            <ViewResult :data="crawl.aggregatedData[url]" :url="url" :key="url" />
                                        </template>
                                    </SlideOver>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </div>
        </div>
        <!-- Confirmation Modal -->
        <div v-if="showConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-lg">
                <h3 class="text-lg font-semibold">Confirm Deletion</h3>
                <p>Are you sure you want to delete this crawl? This action cannot be undone.</p>
                <div class="flex justify-end mt-4 space-x-2">
                    <button @click="deleteCrawl" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                    <button @click="cancelDelete" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Delete Crawl Data Confirmation Modal -->
        <div v-if="showDeleteDataConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-lg max-w-md">
                <h3 class="text-lg font-semibold">Clear Crawl Data</h3>
                <p>Are you sure you want to clear all crawled data for this crawl? The crawl configuration will remain intact, but all collected data will be deleted.</p>
                <div class="flex justify-end mt-4 space-x-2">
                    <button @click="deleteCrawlData" class="bg-orange-500 text-white px-4 py-2 rounded">Clear Data</button>
                    <button @click="cancelDeleteData" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Delete URL Data Confirmation Modal -->
        <div v-if="showDeleteUrlDataConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-lg max-w-md">
                <h3 class="text-lg font-semibold">Clear URL Data</h3>
                <p>Are you sure you want to clear the crawled data for this URL?</p>
                <p class="text-sm text-gray-600 mt-2 break-all">{{ urlToDelete }}</p>
                <div class="flex justify-end mt-4 space-x-2">
                    <button @click="deleteUrlData" class="bg-orange-500 text-white px-4 py-2 rounded">Clear Data</button>
                    <button @click="cancelDeleteUrlData" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Bulk Delete Confirmation Modal -->
        <div v-if="showBulkDeleteConfirm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div class="bg-white p-6 rounded-lg max-w-md">
                <h3 class="text-lg font-semibold">Clear Selected URL Data</h3>
                <p>Are you sure you want to clear the crawled data for {{ selectedUrls.length }} selected URLs?</p>
                <div class="max-h-32 overflow-y-auto mt-2">
                    <p class="text-sm text-gray-600">Selected URLs:</p>
                    <ul class="text-xs text-gray-500 mt-1">
                        <li v-for="url in selectedUrls" :key="url" class="break-all">{{ url }}</li>
                    </ul>
                </div>
                <div class="flex justify-end mt-4 space-x-2">
                    <button @click="bulkDeleteUrlData" class="bg-orange-500 text-white px-4 py-2 rounded">Clear Data</button>
                    <button @click="cancelBulkDelete" class="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
        </div>

        <!-- Add CreateCrawlModal -->
        <CreateCrawlModal
            v-model="showCreateModal"
            :crawl-data="crawl"
            @crawl-created="handleCrawlCreated"
            @error="handleModalError"
        />

        <!-- Add Snackbar -->
        <v-snackbar
            v-model="showSnackbar"
            :color="snackbarColor"
            timeout="3000"
        >
            {{ snackbarText }}
        </v-snackbar>
    </div>
</template>

<script setup>
import { onMounted, ref, watch, inject, computed } from 'vue'
import { io } from "socket.io-client"
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useCrawlStore } from '../stores/crawlStore'
import ViewResult from './ViewResult.vue'
import { useExcerpts } from '../composables/useExcerpts'
import SlideOver from './SlideOver.vue'
import { getStatusColor } from '../utils/statusUtils'
import { getApiUrl, getSocketUrl, formatDateTime } from '../utils/commonUtils'
import CreateCrawlModal from './CreateCrawlModal.vue'
import * as XLSX from 'xlsx'

const baseUrl = getApiUrl()
const apiUrl = getApiUrl()
const socketUrl = getSocketUrl()
const logs = ref([])  // Reactive state for successful crawl results
const socket = ref()  // Ref for the socket instance
const route = useRoute()  // Access the crawl ID from the URL
const router = useRouter()
const crawlId = ref(route.params.crawlId)  // Get crawlId from URL
const crawl = ref(null)  // To store crawl data
const errorMessage = ref('')  // To store any error messages
const liveStatusDictionary = ref({})  // To store status by listening to the socket
const viewResults = ref({})
const excerpts = ref({})  // Store excerpts for each URL
const showConfirm = ref(false)  // Control the visibility of the confirmation modal
const showCreateModal = ref(false)
const showExportMenu = ref(false)  // Control the visibility of the export menu
const queueStatus = ref({ active: 0, waiting: 0, delayed: 0, total: 0 })  // Store queue status

// Add snackbar refs
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Add delete crawl data refs
const showDeleteDataConfirm = ref(false)
const showDeleteUrlDataConfirm = ref(false)
const urlToDelete = ref('')

// Add bulk delete refs
const showBulkDeleteConfirm = ref(false)
const selectedUrls = ref([])
const selectAll = ref(false)

// Inject the notification function
const showNotification = inject('showNotification')

// Computed properties
const hasCrawlData = computed(() => {
    if (!crawl.value?.aggregatedData) return false
    return Object.values(crawl.value.aggregatedData).some(urlData => urlData && urlData.length > 0)
})

const hasUrlData = (url) => {
    return crawl.value?.aggregatedData?.[url] && crawl.value.aggregatedData[url].length > 0
}

const openViewResult = (url) => {
    // Set the clicked URL to true in the viewResults object
    viewResults.value = { ...viewResults.value, [url]: true }
}

const onCloseSlideOver = (url) => {
    // Set the clicked URL to false to close the ViewResult component
    viewResults.value = { ...viewResults.value, [url]: false }
}

// Function to fetch crawl data from the server
const fetchCrawlData = async () => {
    try {
        const response = await axios.get(`${apiUrl}/api/getcrawler/${crawlId.value}`)
        crawl.value = response.data

        // Initialize aggregatedData if it doesn't exist
        if (!crawl.value.aggregatedData) {
            crawl.value.aggregatedData = {}
        }

        // Initialize excerpts for each URL
        crawl.value.urls.forEach((url) => {
            // Initialize aggregatedData for this URL if it doesn't exist
            if (!crawl.value.aggregatedData[url]) {
                crawl.value.aggregatedData[url] = []
            }
            // Initialize excerpt
            excerpts.value[url] = useExcerpts(ref(url), 30)
        })
    } catch (error) {
        errorMessage.value = error.response ? error.response.data.message : 'Error fetching data'
    }
}

// Function to check queue status
// const checkQueueStatus = async () => {
//     try {
//         const response = await axios.get(`${apiUrl}/api/queuestatus/${crawlId.value}`)
//         queueStatus.value = response.data
//     } catch (error) {
//         console.error('Error checking queue status:', error)
//     }
// }

// Initialize Socket.io connection on component mount
onMounted(async () => {
    crawlId.value = route.params.crawlId

    try {
        // Log the socket URL for debugging
        console.log('Connecting to socket at:', socketUrl)
        
        socket.value = io(socketUrl, {
            path: "/socket.io/",
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        })
        
        await fetchCrawlData()
        // await checkQueueStatus()  // Check initial queue status

        // Join the room for the specific crawl ID
        socket.value.emit('joinCrawl', crawlId.value)
        
        // Listen for crawl logs
        socket.value.on("crawlLog", async (data) => {
            console.log('Received crawl log:', data)  // Add logging
            logs.value.push(data)
            
            // Update crawl status if it's a final status update
            if (data.status === 'completed' || data.status === 'failed') {
                crawl.value.status = data.status
                // await checkQueueStatus()  // Check queue status when crawl completes
            } else {
                // Update individual URL status
                liveStatusDictionary.value[data.url] = data.status
            }

            // Append new crawled data into FE rather than making a new api call
            if (data.status === 'success') {
                crawl.value.aggregatedData[data.url]
                    .push({ data: data.result, date: new Date(), status: data.status })
                // await checkQueueStatus()  // Check queue status after each successful crawl
            }
        })

        socket.value.on('connect', () => {
            console.log('Connected to Socket.io server')
        })

        socket.value.on('connect_error', (error) => {
            console.error('Socket connection error:', error)
        })

        socket.value.on('disconnect', (reason) => {
            console.log('Disconnected from Socket.io server:', reason)
        })

    } catch (error) {
        console.error('Socket initialization error:', error)
        errorMessage.value = error.response ? error.response.data.message : 'Error initializing socket connection'
    }
})

const configureCrawl = () => {
    showCreateModal.value = true
}

const startCrawl = async () => {
    try {
        const requestBody = {
            urls: crawl.value.urls,
            crawlId: crawlId.value,
            selectors: crawl.value.selectors || []
        }
        // Make a POST request to start the crawl
        const response = await axios.post(`${apiUrl}/api/startcrawl`, requestBody)
        crawl.value.status = 'in-progress'
        showNotification('Crawl started successfully', 'success')
    } catch (error) {
        const errMsg = error.response?.data?.error || error.message
        showNotification(errMsg, 'error')
    }
}

// Function to show the confirmation modal
const confirmDelete = () => {
    showConfirm.value = true
}

const cancelDelete = () => {
    showConfirm.value = false
}

const deleteCrawl = async () => {
    try {
        await axios.delete(`${apiUrl}/api/deletecrawl/${crawlId.value}`)
        showConfirm.value = false
        showNotification('Crawl deleted successfully', 'success')
        router.push('/')  // Redirect to homepage
    } catch (error) {
        showNotification(error.response?.data?.message || 'Error deleting crawl', 'error')
        showConfirm.value = false
    }
}

// Handler for crawl creation/update
const handleCrawlCreated = (updatedCrawl) => {
    showNotification('Crawl updated successfully', 'success')
    fetchCrawlData()
}

// Error handler for modal
const handleModalError = (errorMessage) => {
    showSnackbar.value = true
    snackbarText.value = errorMessage
    snackbarColor.value = 'error'
}

// Function to format selectors for better readability in exports
const formatSelectors = (selectors) => {
    if (!selectors || !Array.isArray(selectors)) return ''
    
    return selectors.map(selector => {
        if (typeof selector === 'string') {
            return selector
        } else if (typeof selector === 'object' && selector !== null) {
            // Format selector object
            const parts = []
            if (selector.name) parts.push(`Name: ${selector.name}`)
            if (selector.selector) parts.push(`Selector: ${selector.selector}`)
            if (selector.attribute) parts.push(`Attribute: ${selector.attribute}`)
            if (selector.type) parts.push(`Type: ${selector.type}`)
            return parts.join(' | ')
        }
        return String(selector)
    }).join('; ')
}

// Function to flatten nested objects and arrays for export
const flattenObject = (obj, prefix = '') => {
    const flattened = {}
    
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key
        
        if (value === null || value === undefined) {
            flattened[newKey] = ''
        } else if (key === 'selectors' && Array.isArray(value)) {
            // Special handling for selectors
            flattened[newKey] = formatSelectors(value)
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively flatten nested objects
            Object.assign(flattened, flattenObject(value, newKey))
        } else if (Array.isArray(value)) {
            // Handle arrays - join with semicolon or flatten if objects
            if (value.length === 0) {
                flattened[newKey] = ''
            } else if (typeof value[0] === 'object' && value[0] !== null) {
                // If array contains objects, flatten them
                const flattenedArray = value.map((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        return flattenObject(item, `${newKey}_${index + 1}`)
                    }
                    return item
                })
                Object.assign(flattened, ...flattenedArray)
            } else {
                // Simple array - join with semicolon
                flattened[newKey] = value.join('; ')
            }
        } else {
            // Simple value
            flattened[newKey] = value
        }
    }
    
    return flattened
}

// Function to prepare data for export
const prepareExportData = () => {
    const exportData = []
    
    // For each URL in the crawl
    crawl.value.urls.forEach(url => {
        const urlData = crawl.value.aggregatedData[url]
        if (!urlData || !urlData.length) return

        // Process each historical entry for this URL
        urlData.forEach(entry => {
            const row = {
                'URL': url,
                'Crawl Date': new Date(entry.date).toLocaleString(),
                'Status': entry.status
            }

            // Add error message if available
            if (entry.error) {
                row['Error Message'] = entry.error
            }

            // Add data if available - flatten nested objects
            if (entry.data && typeof entry.data === 'object') {
                const flattenedData = flattenObject(entry.data)
                Object.assign(row, flattenedData)
            } else if (entry.data) {
                // If data is a simple value, add it directly
                row['Data'] = entry.data
            }

            exportData.push(row)
        })
    })

    // Sort by URL and then by date (newest first)
    return exportData.sort((a, b) => {
        if (a.URL === b.URL) {
            return new Date(b['Crawl Date']) - new Date(a['Crawl Date'])
        }
        return a.URL.localeCompare(b.URL)
    })
}

// Function to export to CSV
const exportToCSV = () => {
    const data = prepareExportData()
    if (!data.length) {
        showNotification('No data available to export', 'error')
        return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header]
            // Convert all values to strings and escape properly
            let stringValue = ''
            if (value === null || value === undefined) {
                stringValue = ''
            } else if (typeof value === 'object') {
                stringValue = JSON.stringify(value)
            } else {
                stringValue = String(value)
            }
            // Escape commas, quotes, and newlines in the value
            return `"${stringValue.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ')}"`
        }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `crawl_results_${crawlId.value}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    showExportMenu.value = false
    showNotification('CSV file exported successfully', 'success')
}

// Function to export to Excel
const exportToExcel = () => {
    const data = prepareExportData()
    if (!data.length) {
        showNotification('No data available to export', 'error')
        return
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Crawl Results')
    
    // Generate Excel file
    XLSX.writeFile(workbook, `crawl_results_${crawlId.value}_${new Date().toISOString().split('T')[0]}.xlsx`)
    showExportMenu.value = false
    showNotification('Excel file exported successfully', 'success')
}

// Delete crawl data functions
const confirmDeleteCrawlData = () => {
    showDeleteDataConfirm.value = true
}

const cancelDeleteData = () => {
    showDeleteDataConfirm.value = false
}

const deleteCrawlData = async () => {
    try {
        const response = await axios.delete(`${apiUrl}/api/deletecrawldata/${crawlId.value}`)
        showDeleteDataConfirm.value = false
        showNotification(`Crawl data cleared successfully. Deleted ${response.data.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.response?.data?.message || 'Error clearing crawl data', 'error')
        showDeleteDataConfirm.value = false
    }
}

const confirmDeleteUrlData = (url) => {
    urlToDelete.value = url
    showDeleteUrlDataConfirm.value = true
}

const cancelDeleteUrlData = () => {
    showDeleteUrlDataConfirm.value = false
    urlToDelete.value = ''
}

const deleteUrlData = async () => {
    try {
        const response = await axios.delete(`${apiUrl}/api/deletecrawldata/${crawlId.value}/urls`, {
            data: {
                urls: [urlToDelete.value]
            }
        })
        showDeleteUrlDataConfirm.value = false
        urlToDelete.value = ''
        showNotification(`URL data cleared successfully. Deleted ${response.data.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.response?.data?.message || 'Error clearing URL data', 'error')
        showDeleteUrlDataConfirm.value = false
    }
}

// Bulk delete functions
const confirmBulkDelete = () => {
    showBulkDeleteConfirm.value = true
}

const cancelBulkDelete = () => {
    showBulkDeleteConfirm.value = false
    selectedUrls.value = []
    selectAll.value = false
}

const bulkDeleteUrlData = async () => {
    try {
        const response = await axios.delete(`${apiUrl}/api/deletecrawldata/${crawlId.value}/urls`, {
            data: {
                urls: selectedUrls.value
            }
        })
        showBulkDeleteConfirm.value = false
        selectedUrls.value = []
        selectAll.value = false
        showNotification(`Selected URLs cleared successfully. Deleted ${response.data.deletedDataCount} entries.`, 'success')
        await fetchCrawlData() // Refresh the data
    } catch (error) {
        showNotification(error.response?.data?.message || 'Error clearing selected URLs', 'error')
        showBulkDeleteConfirm.value = false
    }
}

// Toggle select all
const toggleSelectAll = () => {
    if (selectAll.value) {
        selectedUrls.value = crawl.value.urls
    } else {
        selectedUrls.value = []
    }
}

// Watch for changes in selectedUrls to update selectAll
watch(selectedUrls, (newSelectedUrls) => {
    if (crawl.value?.urls) {
        selectAll.value = newSelectedUrls.length === crawl.value.urls.length && crawl.value.urls.length > 0
    }
}, { deep: true })
</script>

<style scoped>
.v-card {
    margin-bottom: 1rem;
}
</style>
