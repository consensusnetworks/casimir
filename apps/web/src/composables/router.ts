import { createWebHistory, createRouter } from "vue-router"
import Overview from "@/pages/overview/Overview.vue"
import Operator from "@/pages/operators/Operator.vue"

const routes = [
  { 
    path: "/", 
    name: Overview,
    component: Overview,
  }, { 
    path: "/operator", 
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

export default router