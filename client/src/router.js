import { createRouter, createWebHistory } from "vue-router"
import CrawlerDashboard from "./components/CrawlerDashboard.vue"

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
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router