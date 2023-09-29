import { createWebHistory, createRouter } from 'vue-router'
import Landing from '@/pages/landing/Landing.vue'
import Blog from '@/pages/blog/Blog.vue'
const routes = [
  {
    path: '/',
    name: Landing,
    component: Landing,
  },
  {
    path: '/blog',
    name: Blog,
    component: Blog,
    // children: []
  },
]

const router = createRouter({
  history: createWebHistory(),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  routes,
})

export default router
