import { defineStore } from "pinia"

export const useCrawlStore = defineStore('crawl', {
    state: () => ({
        crawl: {}
    }),
    actions: {
        setData(data) {
            this.crawl = data
        },
        clearData() {
            this.crawl = {}
        }
    }
})