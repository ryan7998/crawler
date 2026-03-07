<template>
  <!-- Reusable table card skeleton (header + table header row + data rows) -->
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
      <div class="mt-2 h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
    </div>
    <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 flex gap-4">
      <div class="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
      <div class="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      <div class="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
    </div>
    <div class="divide-y divide-gray-100">
      <div
        v-for="i in rowCount"
        :key="i"
        class="px-6 py-4 flex items-center gap-4"
      >
        <div class="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        <div class="h-4 bg-gray-200 rounded flex-1 max-w-md animate-pulse"></div>
        <div class="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
        <div class="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** Number of table row placeholders (default 6) */
  rowCount: {
    type: Number,
    default: 6
  }
})
</script>
