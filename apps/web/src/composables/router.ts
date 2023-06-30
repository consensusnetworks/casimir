import { createWebHistory, createRouter } from 'vue-router'
import Overview from '@/pages/overview/Overview.vue'
import Test from '@/pages/test/Test.vue'

const routes = [
    { 
        path: '/', 
        name: Overview,
        component: Overview,
    }
]

if (import.meta.env.DEV) {
    routes.push({ 
        path: '/test', 
        name: Test, 
        component: Test,
    })
}

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes
})

// TO DO: Add a routing beforeEach that 
// dynamically fixes rerouting to auth page

// router.beforeEach(async (to, from, next) => {
    // if (import.meta.env.DEV) {
    //     const appLaunched = sessionStorage.getItem('appLaunch')
    //     if (!appLaunched) {
    //         const { logout } = useWallet()
    //         await logout()
    //         sessionStorage.setItem('appLaunch', 'true')
    //     }
    // }

    // const { checkUserSessionExists } = useUsers()
    // const loggedIn = await checkUserSessionExists()
    // if (to.fullPath === '/auth' && !loggedIn) {
    //     next()
    // } else if (to.fullPath === '/auth' && loggedIn) {
    //     next('/')
    // } else if (!loggedIn) {
    //     next('/auth')
    // } else {
    //     next()
    // }
// })

export default router