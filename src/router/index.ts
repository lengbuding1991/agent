// @ts-ignore  // 临时忽略找不到模块的错误，等待安装 vue-router
import { createRouter, createWebHistory, type Router } from 'vue-router'
import ChatPage from '../views/ChatPage.vue'

const router: Router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatPage
    }
  ]
})

export default router