import { createWebHistory, createRouter } from 'vue-router'
import useUsers from '@/composables/users'

/* eslint-disable @typescript-eslint/ban-ts-comment */
import Overview from '@/pages/overview/Overview.vue'
import Test from '@/pages/test/Test.vue'

const routes = [
    { 
        path: '/', 
        name: Overview,
        component: Overview,
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

router.beforeEach(async (to, from, next) => {
    const { checkUserSessionExists } = useUsers()
    await checkUserSessionExists()
    next()
    // if (to.fullPath === '/auth' && !loggedIn) {
    //     next()
    // } else if (to.fullPath === '/auth' && loggedIn) {
    //     next('/')
    // } else if (!loggedIn) {
    //     next('/auth')
    // } else {
    //     next()
    // }
})

export default router