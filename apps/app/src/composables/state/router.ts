import { createWebHistory, createRouter } from "vue-router"

const routes = [
    { 
        path: "/", 
        // name: Overview,
        // component: Overview,
    },
]


const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

export default router