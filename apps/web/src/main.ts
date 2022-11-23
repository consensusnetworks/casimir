import { createApp } from 'vue'
import App from '@/App.vue'
import '@/index.css'
import router from '@/composables/router'

console.log('Creating app...', import.meta.env)
console.log('Local mocking is', import.meta.env.PUBLIC_MOCK_ENABLED ? 'enabled' : 'disabled')


const app = createApp(App)
app.use(router)
app.mount('#app')
