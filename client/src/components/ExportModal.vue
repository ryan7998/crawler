<template>
    <v-dialog v-model="showExport" max-width="600px">
        <v-card>
            <v-card-title class="text-h5">
                Export Crawl Data with Change Tracking
            </v-card-title>

            <v-card-text>
                <v-form ref="form">
                    <!-- Export Type Selection -->
                    <v-radio-group v-model="exportType" label="Export Type" class="mb-4">
                        <v-radio value="google-sheets" label="Google Sheets" />
                        <v-radio value="csv" label="CSV Download" />
                    </v-radio-group>

                    <!-- Comparison Options -->
                    <v-expansion-panels class="mb-4">
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                Change Detection Options
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-select
                                    v-model="compareWith"
                                    :items="availableCrawls"
                                    item-title="title"
                                    item-value="_id"
                                    label="Compare with previous crawl (optional)"
                                    clearable
                                    hint="Leave empty to compare with previous attempt of the same crawl"
                                    persistent-hint
                                />

                                <v-checkbox
                                    v-model="includeUnchanged"
                                    label="Include unchanged items"
                                    hint="Show items that haven't changed"
                                    persistent-hint
                                />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>

                    <!-- Google Sheets Options -->
                    <div v-if="exportType === 'google-sheets'" class="mb-4">
                        <v-text-field
                            v-model="sheetTitle"
                            label="Sheet Title (optional)"
                            hint="Leave empty to use default title"
                            persistent-hint
                        />

                        <v-checkbox
                            v-model="updateExisting"
                            label="Update existing sheet"
                            hint="Update an existing Google Sheet instead of creating a new one"
                            persistent-hint
                        />

                        <v-text-field
                            v-if="updateExisting"
                            v-model="existingSheetId"
                            label="Existing Sheet ID"
                            hint="The ID of the Google Sheet to update"
                            persistent-hint
                        />
                    </div>

                    <!-- Change Preview -->
                    <div v-if="changeAnalysis" class="mb-4">
                        <v-alert type="info" variant="tonal">
                            <div class="text-h6 mb-2">Change Summary</div>
                            <div class="d-flex justify-space-between">
                                <span>Total URLs: {{ changeAnalysis.totalUrls }}</span>
                                <span>Changed: {{ changeAnalysis.changedUrls }}</span>
                                <span>New: {{ changeAnalysis.newUrls }}</span>
                                <span>Removed: {{ changeAnalysis.removedUrls }}</span>
                            </div>
                            <div class="mt-2">
                                Change Percentage: {{ changeAnalysis.summary?.changePercentage }}%
                            </div>
                        </v-alert>
                    </div>
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn @click="showExport = false" variant="text">
                    Cancel
                </v-btn>
                <v-btn 
                    @click="exportData" 
                    :loading="exporting"
                    :disabled="!exportType"
                    color="primary"
                >
                    {{ exportType === 'google-sheets' ? 'Export to Google Sheets' : 'Download CSV' }}
                </v-btn>
            </v-card-actions>

            <!-- Success Dialog -->
            <v-dialog v-model="showSuccess" max-width="400px">
                <v-card>
                    <v-card-title class="text-h6">
                        Export Successful
                    </v-card-title>
                    <v-card-text>
                        <div v-if="exportType === 'google-sheets' && exportResult?.sheetUrl">
                            <p>Your data has been exported to Google Sheets.</p>
                            <v-btn 
                                :href="exportResult.sheetUrl" 
                                target="_blank"
                                color="primary"
                                class="mt-2"
                            >
                                Open Google Sheet
                            </v-btn>
                        </div>
                        <div v-else>
                            <p>Your CSV file has been downloaded successfully.</p>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn @click="showSuccess = false" color="primary">
                            Close
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { getApiUrl } from '../utils/commonUtils'

const apiUrl = getApiUrl()
console.log('ExportModal - API URL:', apiUrl)

const props = defineProps({
    modelValue: Boolean,
    crawlId: String,
    crawlTitle: String
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

// Computed properties
const showExport = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

// Methods
const loadAvailableCrawls = async () => {
    try {
        const response = await axios.get(`${apiUrl}/api/export/crawls`)
        availableCrawls.value = response.data.crawls
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
        const response = await axios.get(`${apiUrl}/api/export/changes/${props.crawlId}`, { params })
        console.log('Change analysis response:', response.data)
        changeAnalysis.value = response.data
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

            const response = await axios.post(`${apiUrl}/api/export/google-sheets/${props.crawlId}`, payload)
            exportResult.value = response.data
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

            const response = await axios.get(`${apiUrl}/api/export/csv/${props.crawlId}?${params}`, {
                responseType: 'blob'
            })

            // Create download link
            const blob = new Blob([response.data], { type: 'text/csv' })
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
        // Show error notification
        // You can integrate this with your notification system
        alert('Error exporting data: ' + (error.response?.data?.message || error.message))
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

<style scoped>
.v-expansion-panels {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
</style> 