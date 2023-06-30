console.log(import.meta.env.PROD)

import { createApp } from 'vue'
import App from '@/App.vue'
import '@/index.css'
import router from '@/composables/router'

import SuperTokens from 'supertokens-web-js'
import { SuperTokensWebJSConfig } from './sessions.config'

SuperTokens.init(SuperTokensWebJSConfig)

console.log('Creating app...', import.meta.env)

const app = createApp(App)
app.use(router)
app.mount('#app')
