import { createRouter, createWebHistory } from "vue-router"
import CrawlerDashboard from "./components/CrawlerDashboard.vue"
import HomePage from "./components/HomePage.vue"

const routes = [
    {
        path:'/',
        name: 'HomePage',
        component: HomePage,
    },
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