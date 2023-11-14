import { createApp } from "vue"
import App from "@/App.vue"
import "@/index.css"
import router from "@/composables/router"

import SuperTokens from "supertokens-web-js"
import { SuperTokensWebJSConfig } from "./sessions.config"

SuperTokens.init(SuperTokensWebJSConfig)

// const originalFetch = window.fetch
// let fetchCallCount = 0
// window.fetch = async (...args) => {
//     const url = args[0]
//     if (url === "https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b" || url === "http://127.0.0.1:8545")  {
//         fetchCallCount++
//         console.log(`Fetch call count: ${fetchCallCount}`)
//     }
//     return originalFetch(...args)
// }

const app = createApp(App)
app.use(router)
app.mount("#app")