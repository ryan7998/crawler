import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import './index.css' //Import Tailwind css

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router) //Tell Vue to use the router
app.mount('#app')