import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import EquipmentListView from '../views/EquipmentListView.vue'
import TicketsListView from '../views/TicketsListView.vue'
import UsersListView from '../views/UsersListView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: EquipmentListView
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: TicketsListView
    },
    {
      path: '/users',
      name: 'users',
      component: UsersListView
    }
  ]
})

export default router