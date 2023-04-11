import { createWebHistory, createRouter } from 'vue-router'
import useUsers from './users'

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

router.beforeEach((to, from, next) => {
    const { checkUserSessionExists, user } = useUsers()
    const loggedIn = checkUserSessionExists()
    console.log('user in router', user.value)
    if (to.name !== 'Auth' && !loggedIn) next({ name: 'Auth' })
    else next()
})

export default router