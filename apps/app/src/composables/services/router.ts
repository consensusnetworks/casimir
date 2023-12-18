import { createWebHistory, createRouter } from "vue-router"

// Welcome Flow
import WelcomeFlow from "@/pages/welcome/WelcomeFlow.vue"
import LoadingApp from "@/pages/welcome/views/LoadingApp.vue"
import Welcome from "@/pages/welcome/views/Welcome.vue"
import WelcomeBack from "@/pages/welcome/views/WelcomeBack.vue"

// 404
import PageNotFound from "@/pages/404/PageNotFound.vue"

const routes = [
    { 
        path: "/onboarding", 
        name: WelcomeFlow,
        component: WelcomeFlow,
        children: [
            { 
                path: "loading-app", 
                name: LoadingApp,
                component: LoadingApp,
            },
            { 
                path: "welcome", 
                name: Welcome,
                component: Welcome,
            },
            { 
                path: "welcome-back", 
                name: WelcomeBack,
                component: WelcomeBack,
            },
        ]
    },
    { path: "/:pathMatch(.*)*", name: PageNotFound, component: PageNotFound },

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