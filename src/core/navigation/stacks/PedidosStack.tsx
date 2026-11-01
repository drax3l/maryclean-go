import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PedidosScreen from '../../../features/pedidos/PedidosScreen';
import PedidoDetalleScreen from '../../../features/pedidos/PedidoDetalleScreen';

export type PedidosStackParamList = {
  PedidosList: undefined;
  PedidoDetalle: { idPedido: string; codigoTicket: string };
};

const Stack = createNativeStackNavigator<PedidosStackParamList>();

export default function PedidosStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // El Tab Navigator ya muestra el header superior
      }}
    >
      <Stack.Screen name="PedidosList" component={PedidosScreen} />
      <Stack.Screen
        name="PedidoDetalle"
        component={PedidoDetalleScreen}
        options={{
          headerShown: true,
          headerTitle: 'Detalle del Pedido',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
