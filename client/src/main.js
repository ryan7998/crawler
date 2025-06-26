import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import './index.css' //Import Tailwind css

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as labs from 'vuetify/labs/components'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const pinia = createPinia()

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light'
  },
  components: {
    ...labs
  }
})

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)
app.mount('#app')