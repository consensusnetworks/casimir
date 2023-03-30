import { createWebHistory, createRouter, RouterOptions } from 'vue-router'

const routes = [ 
    // No routes for landing anymore, will add more when needed in the future
] as RouterOptions['routes']

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router