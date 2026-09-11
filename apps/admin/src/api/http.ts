import axios from 'axios';
import { AdminApiError } from './errors';

/** P0 真后端 `/api/v1`。Mock 仍可用 `./p0` + `VITE_P0_API_BASE_URL`。 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const TOKEN_STORAGE_KEY = 'artedu_token';
export const REFRESH_STORAGE_KEY = 'artedu_refresh_token';

export const http = axios.create({ baseURL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status ?? 0;
    const data = err.response?.data as { code?: string; message?: string; details?: unknown } | undefined;
    if (status === 401 && !location.pathname.includes('/login')) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      location.href = '/login';
    }
    return Promise.reject(
      new AdminApiError(status, {
        code: data?.code,
        message: data?.message ?? err.message,
        details: data?.details,
      }),
    );
  },
);
