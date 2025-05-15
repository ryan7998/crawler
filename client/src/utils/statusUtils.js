/**
 * Get the appropriate color for a given status
 * @param {string} status - The status to get the color for
 * @returns {string} The color name for Vuetify components
 */
export const getStatusColor = (status) => {
    const colors = {
        'running': 'info',
        'completed': 'success',
        'failed': 'error',
        'pending': 'warning',
        'success': 'success',
        'in-progress': 'info'
    }
    return colors[status?.toLowerCase()] || 'grey'
} 