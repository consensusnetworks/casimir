import { createWebHistory, createRouter } from "vue-router"

// Welcome Flow
import LoadingApp from "@/pages/welcome/views/LoadingApp.vue"
// import Welcome from "@/pages/welcome/views/Welcome.vue"
// import WelcomeBack from "@/pages/welcome/views/WelcomeBack.vue"

const routes = [
    { 
        path: "/", 
        name: LoadingApp,
        component: LoadingApp,
    }
    // { 
    // path: "/overview", 
    // name: Overview,
    // component: Overview,
    // },
    // { 
    //     path: "/stake", 
    // name: Stake,
    // component: Stake,
    // },
    // { 
    //     path: "/explore", 
    // name: Explore,
    // component: Explore,
    // },
    // { 
    //     path: "/settings"
    // name: Settings,
    // component: Settings,
    // },
    // { 
    //     path: "/page-not-found", 
    // name: PageNotFound,
    // component: PageNotFound,
    // },
]

// import { ref } from "vue"
// import { useDark, useToggle, useStorage } from "@vueuse/core"
// const skipWelcomePage = ref(false)
// const skipWelcomePageStorage = useStorage("skipWelcomePage", skipWelcomePage)

// TODO: 
// 1. Check user session 
//      a. if user exists check for if user has skipWelcomePage on 
//          - if user does, take them to /overview
//          - if user does not, take them to /welcome-back
//      b. if user does not exist take them to /welcome

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

export default router