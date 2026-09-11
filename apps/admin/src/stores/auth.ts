import { defineStore } from 'pinia';
import type { AuthMe, Role } from '@art-edu/shared';
import { login as loginApi, logout as logoutApi, me as meApi } from '../api/v1';
import { REFRESH_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../api/http';

export const ROLE_LABEL: Record<Role, string> = {
  admin: '管理员',
  teacher: '教师',
  parent: '家长',
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_STORAGE_KEY) ?? '',
    refreshToken: localStorage.getItem(REFRESH_STORAGE_KEY) ?? '',
    user: null as AuthMe | null,
  }),
  getters: {
    displayName: (s) => s.user?.displayName ?? '',
    roleLabel: (s) => (s.user ? ROLE_LABEL[s.user.role] : ''),
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    persistTokens(accessToken: string, refreshToken: string) {
      this.token = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      localStorage.setItem(REFRESH_STORAGE_KEY, refreshToken);
    },
    async login(phone: string, password: string) {
      const tokens = await loginApi(phone, password);
      if (tokens.role !== 'admin') {
        throw new Error('请使用管理员账号登录管理端');
      }
      this.persistTokens(tokens.accessToken, tokens.refreshToken);
      this.user = {
        id: '',
        phone,
        role: tokens.role,
        displayName: tokens.displayName,
        status: 'active',
      };
      await this.loadMe();
    },
    async loadMe() {
      if (!this.token) return;
      this.user = await meApi();
      if (this.user.role !== 'admin') {
        this.clearSession();
        throw new Error('请使用管理员账号登录管理端');
      }
    },
    async logout() {
      try {
        if (this.token) await logoutApi();
      } catch {
        /* 本地清会话即可 */
      }
      this.clearSession();
    },
    clearSession() {
      this.token = '';
      this.refreshToken = '';
      this.user = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    },
  },
});
