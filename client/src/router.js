import { createRouter, createWebHistory } from "vue-router"
import HomePage from "./components/HomePage.vue"
import CrawlDetailsView from "./components/CrawlDetailsView.vue"
import { useAuth } from "./composables/useAuth"

const routes = [
    {
        path:'/',
        name: 'HomePage',
        component: HomePage,
    },
    {
        path: '/crawl/:crawlId',
        name: 'CrawlDetails',
        component: CrawlDetailsView,
        meta: { requiresAuth: true }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const { isAuthenticated, initializeAuth } = useAuth()
    
    // Initialize auth if not already done
    await initializeAuth()
    
    if (to.meta.requiresAuth && !isAuthenticated.value) {
        // Redirect to home page with login intent
        next({ path: '/', query: { redirect: to.fullPath } })
    } else {
        next()
    }
})


export default router