import { defineStore } from "pinia"

export const useCrawlStore = defineStore('crawl', {
    state: () => ({
        currentCrawl: {}
    }),
    actions: {
        setData(data) {
            this.currentCrawl = data
        },
        clearData() {
            this.currentCrawl = {}
        }
    }
})