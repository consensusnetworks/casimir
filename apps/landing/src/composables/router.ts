import Landing from '@/pages/landing/Landing.vue'
import { createWebHistory, createRouter } from 'vue-router'

const routes = [ 
    { 
        path: '/', 
        name: Landing,
        component: Landing,
    },
]

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

export default router