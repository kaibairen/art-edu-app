import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/LoginView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('./layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/users' },
        { path: 'users', component: () => import('./views/UsersView.vue') },
        { path: 'students', component: () => import('./views/StudentsView.vue') },
        { path: 'settings', component: () => import('./views/SettingsView.vue') },
        { path: 'templates', component: () => import('./views/TemplatesView.vue') },
        { path: 'home', component: () => import('./views/HomeContentView.vue'), meta: { p1: true } },
        { path: 'preview', component: () => import('./views/PublicPreview.vue'), meta: { p1: true } },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    if (to.path === '/login' && auth.token) {
      try {
        if (!auth.user) await auth.loadMe();
        if (auth.isAdmin) return '/users';
      } catch {
        auth.clearSession();
      }
    }
    return true;
  }
  if (!auth.token) {
    return '/login';
  }
  if (!auth.user) {
    try {
      await auth.loadMe();
    } catch {
      auth.clearSession();
      return '/login';
    }
  }
  return true;
});
