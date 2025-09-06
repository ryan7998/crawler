import { defineStore } from "pinia"

export const useCrawlStore = defineStore('crawl', {
    state: () => ({
        currentCrawl: {},
        // Modal states
        showCreateModal: false,
        selectedCrawl: null
    }),
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
        }
    }
})