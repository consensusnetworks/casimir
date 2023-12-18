import { createApp } from "vue"
import "./style.css"
import "./styles/Base.css"
import App from "./App.vue"

import router from "@/composables/services/router"

createApp(App).use(router).mount("#app")
