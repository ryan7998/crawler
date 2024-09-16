import { createRouter, createWebHistory } from "vue-router"
import CrawlerDashboard from "./components/CrawlerDashboard.vue"
import CreateCrawl from "./components/CreateCrawl.vue"

const routes = [
    // {
    //     path:'/',
    //     name: 'Home',
    //     component: Home,
    // },
    {
        path: '/dashboard/:crawlId',
        name: 'CrawlerDashboard',
        component: CrawlerDashboard
    },
    {
        path: '/create',
        name: 'CreateCrawl',
        component: CreateCrawl
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router