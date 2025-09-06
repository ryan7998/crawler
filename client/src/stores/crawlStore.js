import { defineStore } from "pinia"

export const useCrawlStore = defineStore('crawl', {
    state: () => ({
        currentCrawl: {},
        // Crawls data
        allCrawls: [],
        crawlsLoading: false,
        // Modal states
        showCreateModal: false,
        selectedCrawl: null
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
        // Crawls data actions
        setAllCrawls(crawls) {
            this.allCrawls = crawls
        },
        setCrawlsLoading(loading) {
            this.crawlsLoading = loading
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
        }
    }
})