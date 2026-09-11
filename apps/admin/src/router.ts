import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue') },
    {
      path: '/',
      component: () => import('./layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/users' },
        { path: 'users', component: () => import('./views/UsersView.vue') },
        { path: 'students', component: () => import('./views/StudentsView.vue') },
        { path: 'settings', component: () => import('./views/SettingsView.vue') },
        { path: 'templates', component: () => import('./views/TemplatesView.vue') },
        { path: 'home', component: () => import('./views/HomeContentView.vue') },
        { path: 'preview', component: () => import('./views/PublicPreview.vue') },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.path === '/login') {
    return true;
  }
  if (!auth.token) {
    return '/login';
  }
  if (!auth.user) {
    try {
      await auth.loadMe();
    } catch {
      auth.logout();
      return '/login';
    }
  }
  return true;
});
