import { createWebHistory, createRouter } from 'vue-router'
import Landing from '@/pages/landing/Landing.vue'
import Blog from '@/pages/blog/Blog.vue'
import Changelog from '@/pages/changelog/Changelog.vue'
import { defineAsyncComponent } from 'vue'
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
    children: [
      {
        path: 'announcemts',
        component: defineAsyncComponent(() => import('../blogs/blog.md')),
      },
    ],
  },
  {
    path: '/changelog',
    name: Changelog,
    component: Changelog,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  routes,
})

export default router
