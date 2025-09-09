import { defineStore } from "pinia"

export const useCrawlStore = defineStore('crawl', {
    state: () => ({
        currentCrawl: {},
        // Crawls data
        allCrawls: [],
        crawlsLoading: false,
        error: null,
        // Selected crawls for bulk operations
        selectedCrawls: [],
        // Modal states
        showCreateModal: false,
        selectedCrawl: null,
        showGlobalExportModal: false,
        showExportModal: false,
        showQueueStatusModal: false,
        showRunAllConfirm: false,
        showBulkDeleteConfirm: false,
        showAuthModal: false,
        // Confirmation modals for crawl actions
        showDeleteCrawlConfirm: false,
        showClearDataConfirm: false,
        showClearQueueConfirm: false,
        showRestartUrlsConfirm: false,
        selectedUrls: [],
        authModalMode: 'login',
        // Refresh trigger for components
        refreshTrigger: 0
    }),
    getters: {
        // Computed stats from allCrawls
        crawlStats: (state) => {
            const crawls = state.allCrawls || []
            return {
                totalCrawls: crawls.length,
                activeCrawls: crawls.filter(c => c.status === 'in-progress' || c.status === 'pending').length,
                completedCrawls: crawls.filter(c => c.status === 'completed').length,
                totalUrls: crawls.reduce((sum, crawl) => sum + (crawl.urls?.length || 0), 0)
            }
        },
        // Check if we're doing a single delete or bulk delete
        isSingleDelete: (state) => {
            return state.selectedCrawl && state.selectedCrawls.length === 0
        },
        // Get the crawls to delete (either selected crawls or single crawl)
        crawlsToDelete: (state) => {
            if (state.selectedCrawl && state.selectedCrawls.length === 0) {
                return [state.selectedCrawl]
            }
            return state.selectedCrawls
        }
    },
    actions: {
        setData(data) {
            this.currentCrawl = data
        },
        clearData() {
            this.currentCrawl = {}
        },
        // Modal actions
        openCreateModal(crawlData = null) {
            this.selectedCrawl = crawlData
            this.showCreateModal = true
        },
        closeCreateModal() {
            this.showCreateModal = false
            this.selectedCrawl = null
        },
        setSelectedCrawl(crawl) {
            this.selectedCrawl = crawl
        },
        // Global modals
        openGlobalExportModal() {
            this.showGlobalExportModal = true
        },
        closeGlobalExportModal() {
            this.showGlobalExportModal = false
        },
        openExportModal() {
            this.showExportModal = true
        },
        closeExportModal() {
            this.showExportModal = false
        },
        openQueueStatusModal() {
            this.showQueueStatusModal = true
        },
        closeQueueStatusModal() {
            this.showQueueStatusModal = false
        },
        openRunAllConfirm() {
            this.showRunAllConfirm = true
        },
        closeRunAllConfirm() {
            this.showRunAllConfirm = false
        },
        openBulkDeleteConfirm() {
            this.showBulkDeleteConfirm = true
        },
        closeBulkDeleteConfirm() {
            this.showBulkDeleteConfirm = false
            // Clear single delete selection when closing
            this.selectedCrawl = null
        },
        openAuthModal(mode = 'login') {
            this.authModalMode = mode
            this.showAuthModal = true
        },
        closeAuthModal() {
            this.showAuthModal = false
        },
        
        // New confirmation modal actions
        openDeleteCrawlConfirm() {
            this.showDeleteCrawlConfirm = true
        },
        closeDeleteCrawlConfirm() {
            this.showDeleteCrawlConfirm = false
        },
        openClearDataConfirm() {
            this.showClearDataConfirm = true
        },
        closeClearDataConfirm() {
            this.showClearDataConfirm = false
        },
        openClearQueueConfirm() {
            this.showClearQueueConfirm = true
        },
        closeClearQueueConfirm() {
            this.showClearQueueConfirm = false
        },
        openRestartUrlsConfirm() {
            this.showRestartUrlsConfirm = true
        },
        closeRestartUrlsConfirm() {
            this.showRestartUrlsConfirm = false
        },
        setSelectedUrls(urls) {
            this.selectedUrls = urls
        },
        // Crawls data actions
        setAllCrawls(crawls) {
            this.allCrawls = crawls
        },
        setCrawlsLoading(loading) {
            this.crawlsLoading = loading
        },
        setError(error) {
            this.error = error
        },
        clearError() {
            this.error = null
        },
        addCrawl(crawl) {
            this.allCrawls.unshift(crawl)
        },
        updateCrawl(updatedCrawl) {
            const index = this.allCrawls.findIndex(c => c._id === updatedCrawl._id)
            if (index !== -1) {
                this.allCrawls[index] = updatedCrawl
            }
        },
        removeCrawl(crawlId) {
            this.allCrawls = this.allCrawls.filter(c => c._id !== crawlId)
        },
        // Selected crawls actions
        setSelectedCrawls(crawls) {
            this.selectedCrawls = crawls
        },
        addSelectedCrawl(crawlId) {
            if (!this.selectedCrawls.includes(crawlId)) {
                this.selectedCrawls.push(crawlId)
            }
        },
        removeSelectedCrawl(crawlId) {
            this.selectedCrawls = this.selectedCrawls.filter(id => id !== crawlId)
        },
        clearSelectedCrawls() {
            this.selectedCrawls = []
        },
        // Bulk operations
        handleBulkDelete() {
            if (this.selectedCrawls.length === 0) return
            this.openBulkDeleteConfirm()
        },
        canPerformBulkExport() {
            return this.selectedCrawls.length > 0
        },
        confirmDeleteCrawl(crawlId) {
            // Store the crawl ID for single delete without selecting it
            this.selectedCrawl = crawlId
            this.openBulkDeleteConfirm()
        },
        toggleSelectedCrawl(crawlId) {
            const index = this.selectedCrawls.indexOf(crawlId)
            if (index > -1) {
                this.selectedCrawls.splice(index, 1)
            } else {
                this.selectedCrawls.push(crawlId)
            }
        },
        // Trigger refresh for components
        triggerRefresh() {
            this.refreshTrigger++
        }
    }
})