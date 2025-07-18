<template>
    <v-dialog v-model="showExport" max-width="700px">
        <v-card>
            <v-card-title class="text-h5">
                Global Export - All Crawl Changes
            </v-card-title>

            <!-- Storage Check Section -->
            <v-alert
                v-if="storageQuota"
                :type="storageWarning ? 'warning' : 'info'"
                class="mb-4"
            >
                <div>
                    <strong>Google Drive Storage:</strong>
                    <span v-if="storageQuota.usage && storageQuota.limit">
                        {{ formatBytes(storageQuota.usage) }} used of {{ formatBytes(storageQuota.limit) }}
                        ({{ percentUsed }}%)
                    </span>
                    <span v-else>
                        Unable to determine storage usage.
                    </span>
                </div>
                <div v-if="storageWarning" class="text-red">
                    Warning: Storage is above 90%. Exports may fail!
                </div>
            </v-alert>
            <v-btn
                size="small"
                color="info"
                variant="outlined"
                class="mb-4"
                :loading="checkingStorage"
                @click="checkStorage"
            >
                <v-icon start icon="mdi-database-search" />
                Check Google Drive Storage
            </v-btn>

            <v-card-text>
                <v-form ref="form">
                    <!-- Export Type Selection -->
                    <v-radio-group v-model="exportType" label="Export Type" class="mb-4">
                        <v-radio value="google-sheets" label="Google Sheets" />
                        <v-radio value="csv" label="CSV Download" />
                    </v-radio-group>

                    <!-- Export Options -->
                    <v-expansion-panels class="mb-4">
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                Export Options
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="sheetTitle"
                                            label="Sheet Title (Google Sheets only)"
                                            placeholder="Global Crawl Changes"
                                            hint="Leave empty for auto-generated title"
                                            persistent-hint
                                        />
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="limit"
                                            label="Maximum Crawls to Process"
                                            type="number"
                                            min="1"
                                            max="500"
                                            hint="Limit the number of crawls to process"
                                            persistent-hint
                                        />
                                    </v-col>
                                </v-row>

                                <v-row>
                                    <v-col cols="12" md="6">
                                        <v-select
                                            v-model="statusFilter"
                                            label="Status Filter"
                                            :items="statusOptions"
                                            clearable
                                            hint="Filter crawls by status"
                                            persistent-hint
                                        />
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-text-field
                                            v-model="userId"
                                            label="User ID Filter"
                                            clearable
                                            hint="Filter crawls by specific user ID"
                                            persistent-hint
                                        />
                                    </v-col>
                                </v-row>

                                <v-checkbox
                                    v-model="includeUnchanged"
                                    label="Include Unchanged Items"
                                    hint="Include crawls and items with no changes"
                                    persistent-hint
                                />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>

                    <!-- Preview Information -->
                    <v-alert
                        v-if="previewInfo"
                        type="info"
                        variant="tonal"
                        class="mb-4"
                    >
                        <div class="text-body-2">
                            <strong>Preview:</strong><br>
                            • Found {{ previewInfo.crawlCount }} crawls matching criteria<br>
                            • Will process up to {{ limit }} crawls<br>
                            • {{ includeUnchanged ? 'Including' : 'Excluding' }} unchanged items
                        </div>
                    </v-alert>

                    <!-- Export Progress -->
                    <v-progress-linear
                        v-if="exporting"
                        indeterminate
                        color="primary"
                        class="mb-4"
                    />
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn
                    @click="showExport = false"
                    :disabled="exporting"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="primary"
                    @click="exportData"
                    :loading="exporting"
                    :disabled="!exportType"
                >
                    <v-icon start icon="mdi-download" />
                    Export Global Changes
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Success Dialog (moved outside main dialog) -->
    <v-dialog v-model="showSuccess" max-width="500px">
        <v-card>
            <v-card-title class="text-h6">
                Export Completed Successfully!
            </v-card-title>
            <v-card-text>
                <div v-if="exportResult">
                    <p><strong>Processed:</strong> {{ exportResult.processedCrawlCount }} crawls</p>
                    <p><strong>Total URLs:</strong> {{ exportResult.totalUrls }}</p>
                    <p><strong>Changes Found:</strong></p>
                    <ul>
                        <li>New URLs: {{ exportResult.totalNewUrls }}</li>
                        <li>Changed URLs: {{ exportResult.totalChangedUrls }}</li>
                        <li>Removed URLs: {{ exportResult.totalRemovedUrls }}</li>
                    </ul>
                    <p><strong>Total Rows:</strong> {{ exportResult.rowCount }}</p>
                    <v-btn
                        v-if="exportResult.sheetUrl"
                        :href="exportResult.sheetUrl"
                        target="_blank"
                        color="success"
                        class="mt-3"
                    >
                        <v-icon start icon="mdi-open-in-new" />
                        Open Google Sheet
                    </v-btn>
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
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { getApiUrl } from '../utils/commonUtils'

// API configuration
const apiUrl = getApiUrl()

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits(['update:modelValue', 'export-success'])

// Reactive data
const exportType = ref('google-sheets')
const sheetTitle = ref('')
const limit = ref(100)
const statusFilter = ref(null)
const userId = ref('')
const includeUnchanged = ref(false)
const exporting = ref(false)
const showSuccess = ref(false)
const exportResult = ref(null)
const previewInfo = ref(null)
const storageQuota = ref(null)
const checkingStorage = ref(false)

// Status options for filter
const statusOptions = [
    { title: 'All Statuses', value: null },
    { title: 'Pending', value: 'pending' },
    { title: 'In Progress', value: 'in-progress' },
    { title: 'Completed', value: 'completed' },
    { title: 'Failed', value: 'failed' }
]

// Computed properties
const showExport = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const percentUsed = computed(() => {
    if(storageQuota.value.limit === '0') return 0
    else if (!storageQuota.value || !storageQuota.value.usage || !storageQuota.value.limit) return 0
    return ((parseInt(storageQuota.value.usage) / parseInt(storageQuota.value.limit)) * 100).toFixed(1)
})

const storageWarning = computed(() => percentUsed.value > 90)

// Methods
const getPreviewInfo = async () => {
    try {
        const params = new URLSearchParams()
        if (userId.value) params.append('userId', userId.value)
        if (limit.value) params.append('limit', limit.value.toString())
        
        const response = await axios.get(`${apiUrl}/api/export/crawls?${params}`)
        previewInfo.value = {
            crawlCount: response.data.total
        }
    } catch (error) {
        console.error('Error getting preview info:', error)
        previewInfo.value = null
    }
}

const exportData = async () => {
    if (!exportType.value) return

    exporting.value = true

    try {
        if (exportType.value === 'google-sheets') {
            // Export to Google Sheets
            const payload = {
                userId: userId.value || null,
                includeUnchanged: includeUnchanged.value,
                sheetTitle: sheetTitle.value || null,
                limit: parseInt(limit.value),
                statusFilter: statusFilter.value
            }

            const response = await axios.post(`${apiUrl}/api/export/google-sheets/global`, payload)
            exportResult.value = response.data
            showSuccess.value = true
            showExport.value = false
            
            // Emit the export result to parent component
            if (exportResult.value?.sheetUrl) {
                emit('export-success', {
                    sheetUrl: exportResult.value.sheetUrl,
                    exportDate: new Date(),
                    isGlobal: true
                })
            }

        } else if (exportType.value === 'csv') {
            // For CSV, we'll need to implement a different approach
            // since we can't easily combine multiple crawls into a single CSV download
            alert('CSV export for global changes is not yet implemented. Please use Google Sheets export.')
            return
        }

    } catch (error) {
        console.error('Error exporting global data:', error)
        alert('Error exporting global data: ' + (error.response?.data?.message || error.message))
    } finally {
        exporting.value = false
    }
}

const checkStorage = async () => {
    checkingStorage.value = true
    try {
        const response = await axios.get(`${apiUrl}/api/export/google-storage`)
        storageQuota.value = response.data
    } catch (error) {
        storageQuota.value = { error: error.response?.data?.error || error.message }
    } finally {
        checkingStorage.value = false
    }
}

const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

// Watchers
watch([userId, limit], () => {
    getPreviewInfo()
})

watch(showExport, (newValue) => {
    if (newValue) {
        getPreviewInfo()
    }
})

// Lifecycle
onMounted(() => {
    getPreviewInfo()
})
</script>

<style scoped>
.v-expansion-panels {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
</style> 