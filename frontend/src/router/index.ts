import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TerminalDetailView from '../views/TerminalDetailView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/terminal/:id',
    name: 'TerminalDetail',
    component: TerminalDetailView,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router