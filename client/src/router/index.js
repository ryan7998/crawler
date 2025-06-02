import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import CrawlerDashboard from '../components/CrawlerDashboard.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/crawl/:crawlId',
        name: 'CrawlerDashboard',
        component: CrawlerDashboard,
        props: true
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router 