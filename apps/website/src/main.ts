import { createApp } from 'vue'
import App from '@/App.vue'
import '@/index.css'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'

console.log('Creating app...', import.meta.env)
console.log(
  'Local mocking is',
  import.meta.env.PUBLIC_MOCK_ENABLED ? 'enabled' : 'disabled'
)

const app = createApp(App)
const router = createRouter({
  history: createWebHistory(),
  routes,
})
app.use(router)
app.mount('#app')
