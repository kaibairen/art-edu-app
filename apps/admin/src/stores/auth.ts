import { defineStore } from 'pinia';
import { http } from '../api/http';

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('artedu_token') ?? '',
    user: null as AdminUser | null,
  }),
  actions: {
    async login(account: string, password: string) {
      const { data } = await http.post('/auth/login', { account, password });
      if (data.user.role !== 'admin') {
        throw new Error('请使用管理员账号登录管理端');
      }
      this.token = data.accessToken;
      this.user = data.user;
      localStorage.setItem('artedu_token', data.accessToken);
    },
    async loadMe() {
      if (!this.token) return;
      const { data } = await http.get('/auth/me');
      this.user = data;
    },
    logout() {
      this.token = '';
      this.user = null;
      localStorage.removeItem('artedu_token');
    },
  },
});
