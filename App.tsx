import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// En Expo / NativeWind estándar actual (como v2), solo basta className.

import AppNavigator from './src/core/navigation/AppNavigator';
import { useAuthStore } from './src/core/store/authStore';

// Configuración de React Query
const queryClient = new QueryClient();

export default function App() {
  const restoreToken = useAuthStore(state => state.restoreToken);

  // Intentamos restaurar la sesión cuando la app inicia
  useEffect(() => {
    restoreToken();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
