import axios from 'axios';

/** 现网一期 MVP `/api`（业务页使用）。P0 `/api/v1` Mock client 见 `./p0`，勿把业务页改过去。 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const http = axios.create({ baseURL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('artedu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('artedu_token');
      if (!location.pathname.includes('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
