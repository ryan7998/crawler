<template>
    <v-dialog v-model="dialog" max-width="800px" persistent>
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
                <span>Queue Status</span>
                <v-btn icon @click="closeModal">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            
            <v-card-text>
                <div v-if="loading" class="text-center pa-8">
                    <v-progress-circular indeterminate color="primary" size="64" />
                    <p class="mt-4">Loading queue status...</p>
                </div>
                
                <div v-else-if="queueStatusData">
                    <!-- Summary Stats -->
                    <div class="d-flex gap-4 mb-6">
                        <v-chip
                            :color="queueStatusData.summary.totalActive > 0 ? 'blue' : 'grey'"
                            variant="outlined"
                            size="large"
                        >
                            <v-icon start icon="mdi-progress-clock" />
                            {{ queueStatusData.summary.totalActive }} Active
                        </v-chip>
                        <v-chip
                            :color="queueStatusData.summary.totalWaiting > 0 ? 'orange' : 'grey'"
                            variant="outlined"
                            size="large"
                        >
                            <v-icon start icon="mdi-clock-outline" />
                            {{ queueStatusData.summary.totalWaiting }} Waiting
                        </v-chip>
                        <v-chip
                            :color="queueStatusData.summary.totalFailed > 0 ? 'red' : 'grey'"
                            variant="outlined"
                            size="large"
                        >
                            <v-icon start icon="mdi-alert-circle" />
                            {{ queueStatusData.summary.totalFailed }} Failed
                        </v-chip>
                        <v-chip
                            :color="queueStatusData.summary.totalCompleted > 0 ? 'green' : 'grey'"
                            variant="outlined"
                            size="large"
                        >
                            <v-icon start icon="mdi-check-circle" />
                            {{ queueStatusData.summary.totalCompleted }} Completed
                        </v-chip>
                    </div>

                    <!-- Clear All Queues Button -->
                    <div v-if="queueStatusData.queues.length > 0" class="mb-4 text-right">
                        <v-btn
                            color="error"
                            variant="outlined"
                            :loading="clearingAll"
                            :disabled="clearingAll"
                            @click="clearAllQueues"
                        >
                            <v-icon start icon="mdi-broom" />
                            Clear All Queues
                        </v-btn>
                    </div>
                    
                    <!-- Active Queues Details -->
                    <div v-if="queueStatusData.queues.length > 0">
                        <h6 class="text-subtitle-1 mb-3">Active Queues:</h6>
                        <v-list>
                            <v-list-item
                                v-for="queue in queueStatusData.queues" 
                                :key="queue.crawlId"
                                class="mb-2 border rounded"
                            >
                                <template v-slot:prepend>
                                    <v-icon 
                                        :color="queue.active > 0 ? 'blue' : 'grey'"
                                        icon="mdi-queue"
                                    />
                                </template>
                                
                                <v-list-item-title class="font-weight-medium">
                                    Crawl: {{ queue.crawlId }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    Active: {{ queue.active }} | Waiting: {{ queue.waiting }} | Failed: {{ queue.failed }}
                                </v-list-item-subtitle>
                                
                                <template v-slot:append>
                                    <v-btn
                                        variant="text"
                                        size="small"
                                        color="error"
                                        :loading="clearingQueue === queue.crawlId"
                                        @click="clearQueue(queue.crawlId)"
                                    >
                                        <v-icon start icon="mdi-broom" />
                                        Clear
                                    </v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </div>
                    
                    <div v-else class="text-center pa-8 text-grey">
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-queue-outline</v-icon>
                        <p class="text-h6">No active queues found</p>
                        <p class="text-body-2">All queues are currently empty</p>
                    </div>
                </div>
                
                <div v-else class="text-center pa-8 text-grey">
                    <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-alert-circle</v-icon>
                    <p class="text-h6">Failed to load queue status</p>
                    <p class="text-body-2">Please try again</p>
                </div>
            </v-card-text>
            
            <v-card-actions class="pa-4">
                <v-spacer />
                <v-btn
                    variant="outlined"
                    :loading="loading"
                    @click="refreshQueueStatus"
                >
                    <v-icon start icon="mdi-refresh" />
                    Refresh
                </v-btn>
                <v-btn
                    color="primary"
                    @click="closeModal"
                >
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch, inject } from 'vue'
import { useApiService } from '../composables/useApiService'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

// Initialize composables
const { get, del, loading: apiLoading, error: apiError } = useApiService()

// Inject the notification function
const showNotification = inject('showNotification')

const dialog = ref(false)
const loading = ref(false)
const queueStatusData = ref(null)
const clearingQueue = ref(null)
const clearingAll = ref(false)

// Watch for changes in modelValue to open/close modal
watch(() => props.modelValue, (newVal) => {
    dialog.value = newVal
    if (newVal) {
        fetchQueueStatus()
    }
})

// Watch for changes in dialog to emit updates
watch(dialog, (newVal) => {
    emit('update:modelValue', newVal)
})

const closeModal = () => {
    dialog.value = false
}

const fetchQueueStatus = async () => {
    loading.value = true
    try {
        const data = await get('/api/allqueuesstatus')
        queueStatusData.value = data
    } catch (error) {
        console.error('Error fetching queue status:', error)
        queueStatusData.value = null
    } finally {
        loading.value = false
    }
}

const refreshQueueStatus = () => {
    fetchQueueStatus()
}

const clearQueue = async (crawlId) => {
    clearingQueue.value = crawlId
    try {
        await del(`/api/clearqueue/${crawlId}`)
        // Refresh the queue status after clearing
        await fetchQueueStatus()
    } catch (error) {
        console.error('Error clearing queue:', error)
    } finally {
        clearingQueue.value = null
    }
}

const clearAllQueues = async () => {
    clearingAll.value = true
    try {
        const response = await del('/api/clearallqueues')
        showNotification(response.message, 'success')
        await fetchQueueStatus()
    } catch (error) {
        console.error('Error clearing all queues:', error)
        showNotification('Error clearing all queues', 'error')
    } finally {
        clearingAll.value = false
    }
}
</script>

<style scoped>
.border {
    border: 1px solid rgb(var(--v-border-color));
}
</style> 