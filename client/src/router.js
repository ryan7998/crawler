import { createRouter, createWebHistory } from "vue-router"
import CrawlerDashboard from "./components/CrawlerDashboard.vue"
import CreateCrawl from "./components/CreateCrawl.vue"
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
    {
        path: '/create',
        name: 'CreateCrawl',
        component: CreateCrawl,
        // props: (route) => ({
        //     // Map query params to props
        //     initialTitle: route.query.initialTitle || '',
        //     initialUrls : route.query.initialUrls ? JSON.parse(route.query.initialUrls) : [],
        // })
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router