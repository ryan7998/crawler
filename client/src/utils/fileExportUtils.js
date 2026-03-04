/**
 * File export utilities for handling data exports
 * Supports Excel and CSV export formats
 */
import * as XLSX from 'xlsx'

/**
 * Export data to Excel file
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for the export
 * @param {string} sheetName - Sheet name (default: 'Data')
 * @returns {Object} Export result with success status and filename/error
 */
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Data') => {
  try {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Generate and download file
    XLSX.writeFile(workbook, filename)
    
    return { success: true, filename }
  } catch (error) {
    console.error('Export error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Export data to CSV
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for the export
 * @returns {Object} Export result with success status and filename/error
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'No data to export' }
    }

    // Get headers from first row
    const headers = Object.keys(data[0])
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true, filename }
  } catch (error) {
    console.error('CSV export error:', error)
    return { success: false, error: error.message }
  }
}
