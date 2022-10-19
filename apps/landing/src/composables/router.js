import { createWebHistory, createRouter } from 'vue-router'

import Home from '../pages/home/Home.vue'
import NotFound from '../pages/not-found/NotFound.vue'
import Whitepaper from '../pages/whitepaper/Whitepaper.vue'
import Community from '../pages/community/Community.vue'


const routes = [
{ 
    path: '/', 
    name: Home, 
    component: Home,
},
{ 
    path: '/why-casimir', 
    name: Whitepaper, 
    component: Whitepaper,
},
{ 
    path: '/community', 
    name: Community, 
    component: Community,
},
{ 
    path: '/:catchAll(.*)', 
    name: NotFound, 
    component: NotFound,
}
]


const router = createRouter({
history: createWebHistory(),
routes
})


export default router