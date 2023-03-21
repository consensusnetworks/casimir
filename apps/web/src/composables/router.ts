import { createWebHistory, createRouter } from 'vue-router'

/* eslint-disable @typescript-eslint/ban-ts-comment */
import Dashboard from '@/pages/dashboard/Dashboard.vue'
import Test from '@/pages/test/Test.vue'

const routes = [
    { 
        path: '/', 
        name: Dashboard, 
        component: Dashboard,
        meta: { authorize: [] },
    },
    { 
        path: '/test', 
        name: Test, 
        component: Test,
        meta: { authorize: [] },
    },
]


const router = createRouter({
    history: createWebHistory(),
    routes
})


export default router