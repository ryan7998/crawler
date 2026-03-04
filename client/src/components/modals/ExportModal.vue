<template>
    <!-- Main Modal -->
    <div v-if="showExport" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="showExport = false"></div>
            
            <!-- Modal Content -->
            <div class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">
                        Export Crawl Data with Change Tracking
                    </h3>
                    <button
                        @click="showExport = false"
                        class="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Export Type Selection -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Export Type</label>
                        <div class="space-y-3">
                            <label class="flex items-center">
                                <input
                                    v-model="exportType"
                                    type="radio"
                                    value="google-sheets"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span class="ml-3 text-sm text-gray-700">Google Sheets</span>
                            </label>
                            <label class="flex items-center">
                                <input
                                    v-model="exportType"
                                    type="radio"
                                    value="csv"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span class="ml-3 text-sm text-gray-700">CSV Download</span>
                            </label>
                        </div>
                    </div>

                    <!-- Change Detection Options -->
                    <div class="border border-gray-200 rounded-lg">
                        <button
                            @click="showChangeOptions = !showChangeOptions"
                            class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                            <span class="font-medium text-gray-900">Change Detection Options</span>
                            <svg 
                                class="h-5 w-5 text-gray-500 transform transition-transform"
                                :class="{ 'rotate-180': showChangeOptions }"
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <div v-if="showChangeOptions" class="px-4 pb-4 space-y-4">
                            <!-- Info Alert -->
                            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div class="flex">
                                    <svg class="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div class="ml-3">
                                        <p class="text-sm text-blue-800">
                                            <strong>Automatic Comparison:</strong> The system will automatically compare the most recent run with the previous run of this crawl.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Compare With Dropdown -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">
                                    Compare with different crawl (optional)
                                </label>
                                <select
                                    v-model="compareWith"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Automatic comparison with previous run</option>
                                    <option
                                        v-for="crawl in availableCrawls"
                                        :key="crawl._id"
                                        :value="crawl._id"
                                    >
                                        {{ crawl.title }}
                                    </option>
                                </select>
                                <p class="mt-1 text-xs text-gray-500">
                                    Leave empty for automatic comparison with previous run, or select a specific crawl to compare with
                                </p>
                            </div>

                            <!-- Include Unchanged Checkbox -->
                            <label class="flex items-center">
                                <input
                                    v-model="includeUnchanged"
                                    type="checkbox"
                                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span class="ml-3 text-sm text-gray-700">Include unchanged items</span>
                            </label>
                            <p class="ml-7 text-xs text-gray-500">Show items that haven't changed</p>
                        </div>
                    </div>

                    <!-- Google Sheets Options -->
                    <div v-if="exportType === 'google-sheets'" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Sheet Title (optional)
                            </label>
                            <input
                                v-model="sheetTitle"
                                type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Leave empty to use default title"
                            />
                        </div>

                        <label class="flex items-center">
                            <input
                                v-model="updateExisting"
                                type="checkbox"
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span class="ml-3 text-sm text-gray-700">Update existing sheet</span>
                        </label>
                        <p class="ml-7 text-xs text-gray-500">Update an existing Google Sheet instead of creating a new one</p>

                        <div v-if="updateExisting">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Existing Sheet ID
                            </label>
                            <input
                                v-model="existingSheetId"
                                type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="The ID of the Google Sheet to update"
                            />
                        </div>
                    </div>

                    <!-- Change Preview -->
                    <div v-if="changeAnalysis" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center mb-3">
                            <svg class="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h4 class="text-lg font-semibold text-blue-900">Change Summary</h4>
                        </div>
                        
                        <!-- Comparison Info -->
                        <div v-if="changeAnalysis.comparisonInfo" class="mb-4">
                            <div class="text-sm text-blue-800 mb-2">
                                <strong>Comparison:</strong> 
                                <span v-if="changeAnalysis.comparisonInfo.hasPreviousRun" class="text-blue-700">
                                    Most recent run vs Previous run
                                </span>
                                <span v-else class="text-yellow-600">
                                    No previous run found for comparison
                                </span>
                            </div>
                            <div v-if="changeAnalysis.comparisonInfo.currentRunDate" class="text-xs text-blue-600 mb-1">
                                Current run: {{ new Date(changeAnalysis.comparisonInfo.currentRunDate).toLocaleString() }}
                            </div>
                            <div v-if="changeAnalysis.comparisonInfo.previousRunDate" class="text-xs text-blue-600">
                                Previous run: {{ new Date(changeAnalysis.comparisonInfo.previousRunDate).toLocaleString() }}
                            </div>
                        </div>
                        
                        <!-- Stats Grid -->
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                            <div class="text-center">
                                <div class="text-lg font-bold text-blue-900">{{ changeAnalysis.totalUrls }}</div>
                                <div class="text-xs text-blue-600">Total URLs</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-green-600">{{ changeAnalysis.changedUrls }}</div>
                                <div class="text-xs text-blue-600">Changed</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-blue-600">{{ changeAnalysis.newUrls }}</div>
                                <div class="text-xs text-blue-600">New</div>
                            </div>
                            <div class="text-center">
                                <div class="text-lg font-bold text-red-600">{{ changeAnalysis.removedUrls }}</div>
                                <div class="text-xs text-blue-600">Removed</div>
                            </div>
                        </div>
                        
                        <div class="text-xs text-blue-700 mb-2">
                            <strong>Note:</strong> Changes will be shown as separate "Removed" (red) and "New" (green) rows in the export.
                        </div>
                        <div class="text-sm font-medium text-blue-800">
                            Change Percentage: {{ changeAnalysis.summary?.changePercentage }}%
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        @click="showExport = false"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        @click="exportData"
                        :disabled="!exportType || exporting"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span v-if="exporting" class="flex items-center">
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                        </span>
                        <span v-else>
                            {{ exportType === 'google-sheets' ? 'Export to Google Sheets' : 'Download CSV' }}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccess" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="showSuccess = false"></div>
            
            <!-- Success Content -->
            <div class="relative w-full max-w-md bg-white rounded-lg shadow-xl">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0">
                            <svg class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-lg font-semibold text-gray-900">Export Successful</h3>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-600 mb-4">
                        <div v-if="exportType === 'google-sheets' && exportResult?.sheetUrl">
                            <p class="mb-3">Your data has been exported to Google Sheets.</p>
                            <a
                                :href="exportResult.sheetUrl"
                                target="_blank"
                                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Open Google Sheet
                            </a>
                        </div>
                        <div v-else>
                            <p>Your CSV file has been downloaded successfully.</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button
                            @click="showSuccess = false"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useApiService } from '../../composables/useApiService'
import { useNotification } from '../../composables/useNotification'

const { get, post } = useApiService()
const { showNotification } = useNotification()

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    crawlId: {
        type: String,
        default: ''
    },
    crawlTitle: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['update:modelValue', 'export-success'])

// Reactive data
const exportType = ref('google-sheets')
const compareWith = ref(null)
const includeUnchanged = ref(false)
const sheetTitle = ref('')
const updateExisting = ref(false)
const existingSheetId = ref('')
const exporting = ref(false)
const showSuccess = ref(false)
const exportResult = ref(null)
const changeAnalysis = ref(null)
const availableCrawls = ref([])
const showChangeOptions = ref(false)

// Computed properties
const showExport = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Methods
const loadAvailableCrawls = async () => {
    try {
        const data = await get('/api/export/crawls')
        availableCrawls.value = data.crawls
    } catch (error) {
        console.error('Error loading available crawls:', error)
    }
}

const analyzeChanges = async () => {
    if (!props.crawlId) return

    try {
        const params = {}
        if (compareWith.value) {
            params.compareWith = compareWith.value
        }

        console.log('Analyzing changes for crawl:', props.crawlId, 'with params:', params)
        const data = await get(`/api/export/changes/${props.crawlId}`, { params })
        console.log('Change analysis response:', data)
        changeAnalysis.value = data
    } catch (error) {
        console.error('Error analyzing changes:', error)
        changeAnalysis.value = null
    }
}

const exportData = async () => {
    if (!props.crawlId || !exportType.value) return

    exporting.value = true

    try {
        if (exportType.value === 'google-sheets') {
            // Export to Google Sheets
            const payload = {
                compareWith: compareWith.value,
                includeUnchanged: includeUnchanged.value,
                sheetTitle: sheetTitle.value || `Crawl Changes - ${props.crawlTitle}`,
                updateExisting: updateExisting.value,
                existingSheetId: existingSheetId.value
            }

            const response = await post(`/api/export/google-sheets/${props.crawlId}`, payload)
            exportResult.value = response
            showSuccess.value = true
            showExport.value = false
            
            // Emit the export result to parent component
            if (exportResult.value?.sheetUrl) {
                emit('export-success', {
                    sheetUrl: exportResult.value.sheetUrl,
                    exportDate: new Date()
                })
            }

        } else if (exportType.value === 'csv') {
            // Export to CSV
            const params = new URLSearchParams({
                compareWith: compareWith.value || '',
                includeUnchanged: includeUnchanged.value.toString()
            })

            const response = await get(`/api/export/csv/${props.crawlId}?${params}`, {
                responseType: 'blob'
            })

            // Create download link
            const blob = new Blob([response], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `crawl-changes-${props.crawlId}-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            showSuccess.value = true
            showExport.value = false
        }

    } catch (error) {
        console.error('Error exporting data:', error)
        showNotification('Error exporting data: ' + error.message, 'error')
    } finally {
        exporting.value = false
    }
}

// Watchers
watch(compareWith, () => {
    analyzeChanges()
})

watch(showExport, (newValue) => {
    if (newValue) {
        loadAvailableCrawls()
        analyzeChanges()
    }
})

// Lifecycle
onMounted(() => {
    loadAvailableCrawls()
})
</script>
