import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// API Backend en Producción (Render)
const API_BASE_URL = 'https://maryclean-backend.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 60000, // 60 segundos de timeout. IMPORTANTE para Render gratuito que tarda en despertar.
});

// Interceptor de peticiones (Request)
api.interceptors.request.use(
  (config) => {
    // Obtenemos el token directamente del store de Zustand
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas (Response)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si el backend devuelve un 401 Unauthorized, cerramos sesión automáticamente
    if (error.response && error.response.status === 401) {
      console.warn('Token expirado o inválido. Cerrando sesión...');
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
