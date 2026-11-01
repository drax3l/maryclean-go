import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ListOrdered, PlusCircle, User } from 'lucide-react-native';

import DashboardScreen from '../../features/dashboard/DashboardScreen';
import PedidosStack from './stacks/PedidosStack';
import NuevoPedidoScreen from '../../features/pedidos/NuevoPedidoScreen';
import PerfilScreen from '../../features/perfil/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true, // Mostramos el header superior nativo
        headerStyle: {
          backgroundColor: '#0F172A', // text-primary en nuestra paleta (slate-900)
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8', // text-secondary
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Pedidos" 
        component={PedidosStack} 
        options={{
          title: 'Pedidos',
          headerShown: false, // El Stack interno maneja su propio header
          tabBarIcon: ({ color, size }) => (
            <ListOrdered color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="NuevoPedido" 
        component={NuevoPedidoScreen} 
        options={{
          title: 'Nuevo',
          tabBarIcon: ({ color, size }) => (
            <PlusCircle color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
