import { createApp, ref } from "vue"
import "./style.css"
import "./styles/Base.css"
import App from "./App.vue"
import { useDark, useToggle, useStorage } from "@vueuse/core"

import router from "@/composables/services/router"
import SuperTokens from "supertokens-web-js"
import { SuperTokensWebJSConfig } from "./sessions.config"

const newlyLoadedAppStorage = useStorage("newlyLoadedApp", true)
newlyLoadedAppStorage.value = true

SuperTokens.init(SuperTokensWebJSConfig)

createApp(App).use(router).mount("#app")
