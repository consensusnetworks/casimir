/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createWebHistory, createRouter } from 'vue-router'

// @ts-ignore
import Landing from '@/pages/landing/Landing.vue'
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