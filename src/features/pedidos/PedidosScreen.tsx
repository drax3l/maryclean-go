import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { getPedidos, Pedido } from './api/pedidosApi';
import { Package, Clock, ChevronRight } from 'lucide-react-native';
import { PedidosStackParamList } from '../../core/navigation/stacks/PedidosStack';

type NavProp = NativeStackNavigationProp<PedidosStackParamList, 'PedidosList'>;

const ESTADOS = [
  { key: 'todos',      label: 'Todos' },
  { key: 'Recibido',   label: 'Recibido' },
  { key: 'En Proceso', label: 'En Proceso' },
  { key: 'Listo',      label: 'Listo' },
  { key: 'Entregado',  label: 'Entregado' },
  { key: 'Cancelado',  label: 'Cancelado' },
];

const ESTADO_COLORS: Record<string, string> = {
  'Recibido':   'bg-blue-100 text-blue-600',
  'En Proceso': 'bg-yellow-100 text-yellow-600',
  'Listo':      'bg-green-100 text-green-700',
  'Entregado':  'bg-slate-100 text-slate-500',
  'Cancelado':  'bg-red-100 text-red-500',
};

// ── Lista de pedidos filtrada por estado ──────────────────────────────────────
function PedidosList({ estado }: { estado: string }) {
  const navigation = useNavigation<NavProp>();
  const queryClient = useQueryClient();

  const queryKey = ['pedidos', estado];
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => getPedidos(estado === 'todos' ? undefined : estado),
    staleTime: 30_000,
  });

  const renderItem = ({ item }: { item: Pedido }) => {
    const colors = ESTADO_COLORS[item.estado] ?? 'bg-gray-100 text-gray-500';
    const [bg, txt] = colors.split(' ');

    return (
      <TouchableOpacity
        className="bg-white mx-4 mb-4 p-5 rounded-3xl border border-slate-100 shadow-sm flex-row items-center"
        onPress={() => navigation.navigate('PedidoDetalle', {
          idPedido: item.idPedido,
          codigoTicket: item.codigoTicket,
        })}
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <View className="flex-row items-center mb-1.5">
            <Text className="font-black text-slate-800 text-base tracking-tight mr-3">{item.codigoTicket}</Text>
            <View className={`px-2.5 py-1 rounded-full ${bg}`}>
              <Text className={`text-[10px] font-black uppercase tracking-wider ${txt}`}>{item.estado}</Text>
            </View>
          </View>
          <Text className="text-slate-500 font-medium text-sm">
            {item.cliente_nombre ?? (item as any).cliente ?? '—'}
          </Text>
          <View className="flex-row items-center mt-2.5">
            <Clock size={12} color="#94A3B8" />
            <Text className="text-slate-400 font-semibold text-xs ml-1.5">
              {new Date(item.fechaRecepcion).toLocaleDateString('es-PE')}
            </Text>
          </View>
        </View>
        <View className="items-end pl-2">
          <Text className="text-lg font-black text-emerald-600 tracking-tight mb-2">
            S/ {parseFloat(item.total).toFixed(2)}
          </Text>
          <View className="bg-slate-50 p-2 rounded-full">
            <ChevronRight size={16} color="#94A3B8" strokeWidth={2.5} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) return <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 40 }} />;
  if (isError) return (
    <View className="p-6 items-center mt-6">
      <Text className="text-red-500 font-bold">Error cargando pedidos</Text>
      <TouchableOpacity onPress={() => refetch()} className="mt-3 bg-primary px-4 py-2 rounded-lg">
        <Text className="text-white font-bold">Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={item => item.idPedido.toString()}
      renderItem={renderItem}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0EA5E9" />}
      ListEmptyComponent={
        <View className="items-center mt-16">
          <Package size={44} color="#CBD5E1" />
          <Text className="text-secondary mt-3 font-medium">Sin pedidos en esta categoría</Text>
        </View>
      }
    />
  );
}

// ── Pantalla principal con TabView deslizable ─────────────────────────────────
export default function PedidosScreen() {
  const [index, setIndex] = useState(0);
  const routes = ESTADOS.map(e => ({ key: e.key, title: e.label }));

  const renderScene = ({ route }: { route: { key: string } }) => (
    <PedidosList estado={route.key} />
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header propio */}
      <View className="bg-slate-900 px-6 pt-12 pb-4 rounded-b-3xl z-10 shadow-sm">
        <Text className="text-white text-2xl font-black tracking-tight">Órdenes de Servicio</Text>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        lazy
        renderTabBar={props => (
          <TabBar
            {...props}
            scrollEnabled
            style={{ backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, marginVertical: 8 }}
            tabStyle={{ width: 'auto', paddingHorizontal: 16 }}
            indicatorStyle={{ backgroundColor: '#0EA5E9', height: 4, borderRadius: 4, marginHorizontal: 16 }}
            activeColor="#0EA5E9"
            inactiveColor="#94A3B8"
            labelStyle={{ fontWeight: '900', fontSize: 13, textTransform: 'capitalize' }}
          />
        )}
      />
    </View>
  );
}
