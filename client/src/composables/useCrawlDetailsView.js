import { ref, watch, computed } from 'vue'

/**
 * Composable for managing crawl details view state and interactions
 * @param {Object} crawl - The crawl object
 * @returns {Object} URL selection state and methods
 */
export function useCrawlDetailsView(crawl) {
  // URL selection state
  const selectedUrls = ref([])
  const selectAll = ref(false)

  // Computed properties
  const hasSelectedUrls = computed(() => selectedUrls.value.length > 0)
  const selectedCount = computed(() => selectedUrls.value.length)

  // Methods
  const toggleSelectAll = () => {
    if (selectAll.value) {
      // If all are selected, deselect all
      selectedUrls.value = []
    } else {
      // If not all are selected, select all
      selectedUrls.value = [...(crawl.value?.urls || [])]
    }
  }

  const clearSelection = () => {
    selectedUrls.value = []
    selectAll.value = false
  }

  const selectUrl = (url) => {
    if (!selectedUrls.value.includes(url)) {
      selectedUrls.value.push(url)
    }
  }

  const deselectUrl = (url) => {
    const index = selectedUrls.value.indexOf(url)
    if (index > -1) {
      selectedUrls.value.splice(index, 1)
    }
  }

  const toggleUrlSelection = (url) => {
    if (selectedUrls.value.includes(url)) {
      deselectUrl(url)
    } else {
      selectUrl(url)
    }
  }

  // Watch for changes in selectedUrls to update selectAll
  watch(selectedUrls, (newSelectedUrls) => {
    if (crawl.value?.urls) {
      selectAll.value = newSelectedUrls.length === crawl.value.urls.length && crawl.value.urls.length > 0
    }
  }, { deep: true })

  // Watch for changes in crawl to reset selection
  watch(crawl, () => {
    clearSelection()
  })

  return {
    // State
    selectedUrls,
    selectAll,
    
    // Computed
    hasSelectedUrls,
    selectedCount,
    
    // Methods
    toggleSelectAll,
    clearSelection,
    selectUrl,
    deselectUrl,
    toggleUrlSelection
  }
}
