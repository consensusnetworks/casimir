import { createApp } from 'vue'
import App from '@/App.vue'
import '@/index.css'
import router from './composables/router.js'

const app = createApp(App)
app.use(router)
app.mount('#app')
