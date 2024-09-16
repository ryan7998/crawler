<template>
    <div class="flex space-x-2">
        <div>
            <label for="selector-name" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
            <input v-model="selector.name" type="selector-name" id="selector-name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter selector name" />
        </div>
        <div>
            <label for="selector-css" class="text-left block mb-2 text-sm font-medium text-gray-900 dark:text-white">Css Selector</label>
            <input v-model="selector.css" type="selector-css" id="selector-css" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter css selector" />
        </div>
        <div class="flex items-end">
            <button type="button" class="rounded-md text-xs text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium text-sm px-2.5 py-2"
                @click="$emit('removeSelector', selector.index)"
            >X</button>
        </div>
    </div>
</template>

<script setup>
    import { reactive, onMounted, watch, ref } from 'vue'

    const {selector} = defineProps(['selector'])
</script>