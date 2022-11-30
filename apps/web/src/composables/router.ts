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
import Assets from '@/pages/assets/Assets.vue'
// @ts-ignore
import Test from '@/pages/test/Test.vue'

// import NotFound from '@/pages/not-found/NotFound.vue'


const routes = [
{ 
    path: '/', 
    name: Landing, 
    component: Landing,
    meta: { authorize: [] }
},
{ 
    path: '/Staking', 
    name: Staking, 
    component: Staking,
    meta: { authorize: [] },
    children: [
        {
            path: 'ETH', 
            component: ETHStaking,
        },
        {
            path: 'ETH/Select-Wallet', 
            component: ETHWalletSelect,
        }
    ]
},{ 
    path: '/Assets', 
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