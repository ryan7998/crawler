import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './index.css' //Import Tailwind css

const app = createApp(App)
app.use(router) //Tell Vue to use the router
app.mount('#app')