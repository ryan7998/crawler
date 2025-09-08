<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :loading="loading"
    :search="search"
    :sort-by="sortBy"
    :sort-desc="sortDesc"
    :items-per-page="itemsPerPage"
    :items-per-page-options="itemsPerPageOptions"
    class="elevation-0"
    v-bind="$attrs"
  >
    <!-- Dynamic slot templates -->
    <template
      v-for="(_, name) in $slots"
      :key="name"
      #[name]="slotData"
    >
      <slot :name="name" v-bind="slotData" />
    </template>

    <!-- Default slot for custom content -->
    <template v-slot:default="slotData">
      <slot v-bind="slotData" />
    </template>
  </v-data-table>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  headers: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  search: {
    type: String,
    default: ''
  },
  sortBy: {
    type: Array,
    default: () => []
  },
  sortDesc: {
    type: Array,
    default: () => []
  },
  itemsPerPage: {
    type: Number,
    default: 10
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 25, 50]
  }
})

// Expose props for parent components
defineExpose({
  headers: computed(() => props.headers),
  items: computed(() => props.items),
  loading: computed(() => props.loading)
})
</script>

<style scoped>
/* Custom styles for data table */
:deep(.v-data-table) {
  border-radius: 8px;
}

:deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

:deep(.v-data-table-header) {
  background-color: #f5f5f5;
}

:deep(.v-data-table__td) {
  padding: 12px 16px;
}

:deep(.v-data-table__th) {
  padding: 12px 16px;
  font-weight: 600;
}
</style> 