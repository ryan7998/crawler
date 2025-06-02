<template>
    <div class="pa-4">
        <template v-if="tableData.length">
            <h3 class="text-h6 mb-4">Crawl History</h3>
            <v-table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th v-for="key in allKeys" :key="key">{{ formatKey(key) }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in tableData" :key="row.date">
                        <td>{{ formatDate(row.date) }}</td>
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
        <v-alert v-else type="info" class="mt-4">
            No crawl data available
        </v-alert>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['data'])

// Format date to readable string
const formatDate = (date) => {
    return new Date(date).toLocaleString()
}

// Format key to readable string
const formatKey = (key) => {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

// Get all unique keys from all data objects
const allKeys = computed(() => {
    if (!props.data || !Array.isArray(props.data)) return []
    
    const keys = new Set()
    props.data.forEach(item => {
        if (item.data) {
            Object.keys(item.data).forEach(key => keys.add(key))
        }
    })
    return Array.from(keys)
})

// Transform data into table format
const tableData = computed(() => {
    if (!props.data || !Array.isArray(props.data)) return []
    
    return props.data.map(item => ({
        date: item.date,
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