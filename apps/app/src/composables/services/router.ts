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


const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

export default router