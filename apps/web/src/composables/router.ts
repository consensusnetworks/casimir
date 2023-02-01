/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createWebHistory, createRouter } from 'vue-router'

// @ts-ignore
import Landing from '@/pages/landing/Landing.vue'
// @ts-ignore
import Staking from '@/pages/staking/Staking.vue'
// @ts-ignore
import ETHStaking from '@/pages/staking/components/ETHStaking.vue'
// @ts-ignore
import ETHWalletSelect from '@/pages/staking/components/ETHWalletSelect.vue'
// @ts-ignore
import ETHConfirmStake from '@/pages/staking/components/ETHConfirmStake.vue'
// @ts-ignore
import Assets from '@/pages/assets/Assets.vue'
// @ts-ignore
import Test from '@/pages/test/Test.vue'
// @ts-ignore
import ChartTest from '@/pages/chart-test/ChartTest.vue'
// @ts-ignore
import FrontPage from '@/pages/landing/components/FrontPage.vue'
// @ts-ignore
import UserDashboard from '@/pages/landing/components/UserDashboard.vue'
// import NotFound from '@/pages/not-found/NotFound.vue'


const routes = [
{ 
    path: '/', 
    name: Landing, 
    component: Landing,
    meta: { authorize: [] },
    children: [
        {
            path: 'front-page', 
            component: FrontPage,
        },
        {
            path: 'user-dashboard:id', 
            component: UserDashboard,
        },
    ]
},
{ 
    path: '/stake', 
    name: Staking, 
    component: Staking,
    meta: { authorize: [] },
    children: [
        {
            path: 'eth', 
            component: ETHStaking,
        },
        {
            path: 'eth/select-wallet', 
            component: ETHWalletSelect,
        },
        {
            path: 'eth/confirm-stake', 
            component: ETHConfirmStake,
        }
    ]
},{ 
    path: '/assets', 
    name: Assets, 
    component: Assets,
    meta: { authorize: [] }
},
{ 
    path: '/test', 
    name: Test, 
    component: Test,
    meta: { authorize: [] }
},
{ 
    path: '/chart', 
    name: ChartTest, 
    component: ChartTest,
    meta: { authorize: [] }
},
// { 
//     path: '/:catchAll(.*)', 
//     name: NotFound, 
//     component: NotFound,
//     meta: { authorize: [] }
// }
]


const router = createRouter({
    history: createWebHistory(),
    routes
})


export default router