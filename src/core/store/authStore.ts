import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'maryclean_jwt_token';

interface User {
  id: number;
  nombres: string;
  rol: string;
  sucursal: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  
  // Acciones
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true, // Inicia cargando para verificar si ya hay sesión

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    // Idealmente, el user también se guarda si se desea persistir
    await SecureStore.setItemAsync('maryclean_user', JSON.stringify(user || {}));
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync('maryclean_user');
    set({ token: null, user: null, isLoading: false });
  },

  restoreToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync('maryclean_user');
      
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ token: null, user: null, isLoading: false });
      }
    } catch (e) {
      console.error('Error restaurando el token:', e);
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
