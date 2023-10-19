import { createWebHistory, createRouter } from 'vue-router'
import Landing from '@/pages/landing/Landing.vue'
import Changelog from '@/pages/changelog/Changelog.vue'
import Blog from '@/pages/blog/Blog.vue'
import Article from '@/pages/blog/components/Article.vue'
const routes = [
    {
        path: '/',
        name: Landing,
        component: Landing,
    },
    {
        path: '/blogs',
        name: Blog,
        component: Blog,
    },
    {
        path: '/blog/:id',
        component: Article,
        children: [{ path: '', name: Article, component: Article }],
    },
    {
        path: '/changelog',
        name: Changelog,
        component: Changelog,
    },
]

const router = createRouter({
    history: createWebHistory(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    routes,
})

export default router
