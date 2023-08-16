import { createWebHistory, createRouter } from 'vue-router'
import useUsers from '@/composables/users'
import Overview from '@/pages/overview/Overview.vue'
import Operator from '@/pages/operators/Operator.vue'

const routes = [
    { 
        path: '/', 
        name: Overview,
        component: Overview,
    },
    { 
        path: '/operator', 
        name: Operator,
        component: Operator,
    }
]

if (import.meta.env.DEV) {
    // routes.push({ 
    //     path: '/test', 
    //     name: Test, 
    //     component: Test,
    // })
}

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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