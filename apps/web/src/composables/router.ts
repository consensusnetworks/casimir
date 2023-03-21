import { createWebHistory, createRouter } from 'vue-router'

/* eslint-disable @typescript-eslint/ban-ts-comment */
import Dashboard from '@/pages/dashboard/Dashboard.vue'
import Test from '@/pages/test/Test.vue'
import Auth from '@/pages/auth/Auth.vue'

const routes = [
    { 
        path: '/', 
        name: Dashboard, 
        component: Dashboard,
    },
    { 
        path: '/auth', 
        name: Auth, 
        component: Auth,
    },
    { 
        path: '/test', 
        name: Test, 
        component: Test,
    },
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

// TO DO: Add a routing beforeEach that 
// dynamically fixes rerouting to auth page

export default router