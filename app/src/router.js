import { createRouter, createWebHistory } from 'vue-router'
import Edt from './components/Edt.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/edt/',
      name: 'edt',
      component: Edt
    }
  ]
})

export default router
