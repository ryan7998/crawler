/**
 * Get the appropriate TailwindCSS color classes for a given status
 * @param {string} status - The status to get the color for
 * @returns {string} The TailwindCSS color classes
 */
export const getStatusColor = (status) => {
    const colors = {
        'running': 'text-blue-600 bg-blue-100',
        'completed': 'text-green-600 bg-green-100',
        'failed': 'text-red-600 bg-red-100',
        'pending': 'text-yellow-600 bg-yellow-100',
        'success': 'text-green-600 bg-green-100',
        'in-progress': 'text-blue-600 bg-blue-100'
    }
    return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-100'
} 