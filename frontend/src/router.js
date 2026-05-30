import { createRouter, createWebHistory } from 'vue-router'
import { session } from '@/data/session'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/list/:doctype',
    name: 'DocList',
    component: () => import('@/pages/DocList.vue'),
    props: true,
  },
  {
    path: '/view/:doctype/:name',
    name: 'DocDetail',
    component: () => import('@/pages/DocDetail.vue'),
    props: true,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/Settings.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
  },
]

// Base path must match where Frappe serves the app (see hooks.py).
const router = createRouter({
  history: createWebHistory('/docflow'),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.name !== 'Login' && !session.isLoggedIn) {
    session.redirectRoute = to.fullPath
    next({ name: 'Login' })
  } else if (to.name === 'Login' && session.isLoggedIn) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
