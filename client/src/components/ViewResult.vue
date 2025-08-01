<template>
    <div class="pa-4">
        <!-- Handle error message case -->
        <v-alert v-if="typeof props.data === 'string'" type="error" class="mb-4">
            {{ props.data }}
        </v-alert>
        
        <!-- Handle normal data case -->
        <template v-else-if="tableData.length">
            <h3 class="text-h6 mb-4">Crawl History</h3>
            <v-table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th v-if="hasErrors">Error Message</th>
                        <th v-for="key in allKeys" :key="key">{{ formatKey(key) }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in tableData" :key="row.date">
                        <td>{{ formatDateTime(row.date) }}</td>
                        <td>
                            <v-chip 
                                :color="row.status === 'success' ? 'success' : 'error'" 
                                size="small"
                            >
                                {{ row.status }}
                            </v-chip>
                        </td>
                        <td v-if="hasErrors">
                            <v-alert 
                                v-if="row.error" 
                                type="error" 
                                variant="tonal" 
                                density="compact"
                                class="ma-0 pa-2"
                            >
                                {{ row.error }}
                            </v-alert>
                        </td>
                        <td v-for="key in allKeys" :key="key">
                            <template v-if="Array.isArray(row.data[key])">
                                <v-list>
                                    <v-list-item v-for="(item, index) in row.data[key]" :key="index">
                                        {{ item }}
                                    </v-list-item>
                                </v-list>
                            </template>
                            <template v-else>
                                {{ row.data[key] }}
                            </template>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </template>
        
        <!-- Handle no data case -->
        <v-alert v-else type="info" class="mt-4">
            No crawl data available
        </v-alert>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '../utils/commonUtils'

const props = defineProps(['data'])

// Format key to readable string
const formatKey = (key) => {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Check if any entries have errors
const hasErrors = computed(() => {
    if (!props.data || !Array.isArray(props.data)) return false
    return props.data.some(item => item.error)
})

// Get all unique keys from all data objects
const allKeys = computed(() => {
    if (!props.data) return []
    
    // Handle case where data is a string (error message)
    if (typeof props.data === 'string') return []
    
    // Handle case where data is not an array
    if (!Array.isArray(props.data)) return []
    
    const keys = new Set()
    props.data.forEach(item => {
        if (item && item.data && typeof item.data === 'object') {
            Object.keys(item.data).forEach(key => keys.add(key))
        }
    })
    return Array.from(keys)
})

// Transform data into table format
const tableData = computed(() => {
    if (!props.data) return []
    
    // Handle case where data is a string (error message)
    if (typeof props.data === 'string') return []
    
    // Handle case where data is not an array
    if (!Array.isArray(props.data)) return []
    
    return props.data.map(item => ({
        date: item.date,
        status: item.status,
        error: item.error,
        data: item.data || {}
    }))
})
</script>

<style scoped>
.v-list {
    padding: 0;
}
.v-table {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>