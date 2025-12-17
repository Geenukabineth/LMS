import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.API_ENDPOINTS;

const api = axios.create({
  baseURL: API_URL,
  // baseURL: 'http://localhost:3000',
  // baseURL: 'https://api.tms.residue.technook.lk',
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;