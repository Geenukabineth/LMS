import axios from 'axios';
import authService from '@/context/authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  
});

/* Attach JWT */
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* Handle 401 globally */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refreshToken();
        return api(error.config);
      } catch {
        authService.logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
