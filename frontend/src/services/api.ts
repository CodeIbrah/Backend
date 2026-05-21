import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status === 401 && !(original as any)?._retry) {
      (original as any)._retry = true;
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: rt });
          localStorage.setItem('accessToken', data.data.accessToken);
          original!.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original!);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
