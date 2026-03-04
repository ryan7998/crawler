import { ref } from 'vue'
import { saveExportMetadata, loadExportMetadata } from '../utils/fileUtils'
import { useNotification } from './useNotification'

/**
 * Composable for managing crawl export functionality
 * @param {Object} crawlId - The crawl ID
 * @returns {Object} Export state and methods
 */
export function useCrawlExport(crawlId) {
  // State
  const latestExportLink = ref('')
  const latestExportDate = ref(null)
  const exportLoading = ref(false)

  // Use notification composable
  const { showNotification } = useNotification()

  // Methods
  const loadExportData = () => {
    const savedExport = loadExportMetadata(crawlId.value)
    if (savedExport) {
      latestExportLink.value = savedExport.sheetUrl
      latestExportDate.value = new Date(savedExport.exportDate)
    }
  }

  const handleExportSuccess = (exportResult) => {
    latestExportLink.value = exportResult.sheetUrl
    latestExportDate.value = exportResult.exportDate
    
    // Save to localStorage for persistence
    saveExportMetadata(crawlId.value, {
      sheetUrl: exportResult.sheetUrl,
      exportDate: exportResult.exportDate
    })
    
    showNotification('Export completed successfully!', 'success')
  }

  const clearExportData = () => {
    latestExportLink.value = ''
    latestExportDate.value = null
  }

  const hasExportData = () => {
    return !!latestExportLink.value
  }

  return {
    // State
    latestExportLink,
    latestExportDate,
    exportLoading,
    
    // Methods
    loadExportData,
    handleExportSuccess,
    clearExportData,
    hasExportData
  }
}
