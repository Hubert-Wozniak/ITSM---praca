import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import TicketsListView from '../views/TicketsListView.vue';
import EquipmentListView from '../views/EquipmentListView.vue';
import UsersListView from '../views/UsersListView.vue';
import LoginView from '../views/LoginView.vue';
import { useAuth } from '../composables/useAuth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: TicketsListView
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: EquipmentListView
    },
    {
      path: '/users',
      name: 'users',
      component: UsersListView
    }
  ]
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();

  if (!to.meta.public && !isAuthenticated.value) {
    return { path: '/login' };
  }

  if (to.path === '/login' && isAuthenticated.value) {
    return { path: '/' };
  }

  return true;
});

export default router;