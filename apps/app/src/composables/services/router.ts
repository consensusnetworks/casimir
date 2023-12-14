import { createWebHistory, createRouter } from "vue-router"

const routes = [
    { 
        path: "/", 
        // name: Overview,
        // component: Overview,
        // children: [
        // { 
        //     path: "/welcome", 
        //     name: Overview,
        //     component: Overview,
        // },
        // { 
        //     path: "/welcome-back", 
        //     name: Overview,
        //     component: Overview,
        // },
        // ]
    },
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