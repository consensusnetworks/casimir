import { createWebHistory, createRouter } from "vue-router"

import Stake from "@/pages/stake/Stake.vue"
import PageNotFound from "@/pages/404/PageNotFound.vue"

const routes = [
    { 
        path: "/", 
        name: Stake,
        component: Stake
    },
    { 
        path: "/:pathMatch(.*)*", 
        name: PageNotFound,
        component: PageNotFound 
    },
]


const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

export default router