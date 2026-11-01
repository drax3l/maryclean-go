import React from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Linking
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats, getEntregasUrgentes, getClientesFrecuentes,
  EntregaUrgente, ClienteFrecuente
} from './api/getDashboardStats';
import { useAuthStore } from '../../core/store/authStore';
import {
  Package, TrendingUp, Clock, AlertTriangle,
  Users, Phone, RefreshCw, Star
} from 'lucide-react-native';

// Calcula cuántos días han pasado desde una fecha
function diasDesde(fechaStr: string): number {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

function MetricCard({
  label, value, icon, bgColor, textColor
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}) {
  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100" style={{ width: '48%', marginBottom: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className={`w-12 h-12 rounded-full items-center justify-center ${bgColor}`}>
          {icon}
        </View>
      </View>
      <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</Text>
      <Text className={`text-2xl font-black ${textColor}`}>{value}</Text>
    </View>
  );
}

// ── Componente: Fila de entrega urgente ──────────────────────────────────────
function EntregaRow({ item }: { item: EntregaUrgente }) {
  const dias = diasDesde(item.fechaRecepcion);
  const esUrgente = dias >= 3;

  const abrirWhatsApp = () => {
    if (!item.telefonoCliente) return;
    const msg = `Hola *${item.cliente}*, tu pedido *${item.codigoTicket}* está listo en MaryClean. ¡Pasa a recogerlo!`;
    Linking.openURL(`whatsapp://send?phone=51${item.telefonoCliente}&text=${encodeURIComponent(msg)}`);
  };

  return (
    <View className={`p-4 rounded-3xl mb-3 flex-row items-center border ${esUrgente ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="font-black text-slate-800 text-base tracking-tight">{item.codigoTicket}</Text>
          {esUrgente && (
            <View className="ml-3 bg-red-500 px-2.5 py-1 rounded-full">
              <Text className="text-white text-[10px] font-black uppercase tracking-wider">¡{dias} DÍAS!</Text>
            </View>
          )}
        </View>
        <Text className="text-slate-500 font-medium text-sm">{item.cliente}</Text>
        <View className="flex-row items-center mt-2">
          <Clock size={12} color={esUrgente ? '#EF4444' : '#94A3B8'} />
          <Text className={`text-xs font-semibold ml-1 ${esUrgente ? 'text-red-500' : 'text-slate-400'}`}>
            {dias === 0 ? 'Ingresó hoy' : `Hace ${dias} día${dias > 1 ? 's' : ''}`} • {item.estado}
          </Text>
        </View>
      </View>
      {item.telefonoCliente && (
        <TouchableOpacity
          className="bg-green-500 p-3 rounded-2xl ml-3 shadow-sm shadow-green-200"
          onPress={abrirWhatsApp}
          activeOpacity={0.8}
        >
          <Phone color="#fff" size={18} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────────────
export default function DashboardScreen() {
  const user = useAuthStore(state => state.user);

  const stats = useQuery({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
  const urgentes = useQuery({ queryKey: ['entregasUrgentes'], queryFn: getEntregasUrgentes });
  const frecuentes = useQuery({ queryKey: ['clientesFrecuentes'], queryFn: getClientesFrecuentes });

  const isRefreshing = stats.isRefetching || urgentes.isRefetching || frecuentes.isRefetching;

  const onRefresh = () => {
    stats.refetch();
    urgentes.refetch();
    frecuentes.refetch();
  };

  const fmt = (v?: string | number) =>
    v !== undefined ? parseFloat(v.toString()).toFixed(2) : '0.00';

  const num = (v?: string | number) =>
    v !== undefined ? Number(v) : 0;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0EA5E9" />
      }
    >
      {/* ── Saludo Premium ── */}
      <View className="px-6 pt-10 pb-6 bg-white rounded-b-[40px] shadow-sm mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 font-semibold uppercase tracking-widest text-xs mb-1">
              {stats.data?.fecha
                ? new Date(stats.data.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
                : 'Hoy'}
            </Text>
            <Text className="text-3xl font-black text-slate-800 tracking-tight">
              Hola, {user?.nombres?.split(' ')[0] || 'Equipo'} <Text className="text-2xl">👋</Text>
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center border border-blue-200">
            <Text className="text-blue-600 font-black text-lg">
              {user?.nombres?.charAt(0).toUpperCase() || 'M'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 4 Tarjetas de métricas ── */}
      <View className="px-6 mb-2">
        {stats.isLoading && !isRefreshing ? (
          <ActivityIndicator size="large" color="#0EA5E9" className="my-6" />
        ) : stats.isError ? (
          <View className="bg-red-50 p-4 rounded-3xl mb-4">
            <Text className="text-red-500 font-bold">Error al cargar métricas</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            <MetricCard
              label="Pedidos Hoy"
              value={num(stats.data?.pedidos_hoy)}
              bgColor="bg-blue-100"
              textColor="text-slate-800"
              icon={<Package color="#2563EB" size={24} strokeWidth={2.5} />}
            />
            <MetricCard
              label="Ingresos"
              value={`S/ ${fmt(stats.data?.ingresos_hoy)}`}
              bgColor="bg-emerald-100"
              textColor="text-slate-800"
              icon={<TrendingUp color="#059669" size={24} strokeWidth={2.5} />}
            />
            <MetricCard
              label="Activos"
              value={num(stats.data?.pedidos_activos)}
              bgColor="bg-amber-100"
              textColor="text-slate-800"
              icon={<RefreshCw color="#D97706" size={24} strokeWidth={2.5} />}
            />
            <MetricCard
              label="Pendientes"
              value={num(stats.data?.pendientes_cobro)}
              bgColor="bg-rose-100"
              textColor="text-rose-600"
              icon={<Clock color="#E11D48" size={24} strokeWidth={2.5} />}
            />
          </View>
        )}
      </View>

      {/* ── Entregas Urgentes ── */}
      <View className="px-6 mt-4 mb-6">
        <View className="flex-row items-center mb-4">
          <View className="bg-red-100 p-2 rounded-xl mr-3">
            <AlertTriangle color="#EF4444" size={20} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-black text-slate-800 tracking-tight">Entregas Urgentes</Text>
        </View>

        {urgentes.isLoading ? (
          <ActivityIndicator color="#0EA5E9" />
        ) : urgentes.isError ? (
          <View className="bg-slate-100 p-4 rounded-3xl">
            <Text className="text-slate-500 text-sm text-center font-medium">No se pudieron cargar</Text>
          </View>
        ) : (urgentes.data?.length ?? 0) === 0 ? (
          <View className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 items-center shadow-sm">
            <Text className="text-emerald-700 font-bold text-base">🎉 ¡Todo al día!</Text>
            <Text className="text-emerald-600 text-sm mt-1">No hay pedidos retrasados</Text>
          </View>
        ) : (
          urgentes.data!.map(item => (
            <EntregaRow key={item.idPedido} item={item} />
          ))
        )}
      </View>

      {/* ── Clientes Frecuentes ── */}
      <View className="px-6 mb-12">
        <View className="flex-row items-center mb-4">
          <View className="bg-amber-100 p-2 rounded-xl mr-3">
            <Star color="#F59E0B" size={20} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-black text-slate-800 tracking-tight">Top Clientes</Text>
        </View>

        {frecuentes.isLoading ? (
          <ActivityIndicator color="#0EA5E9" />
        ) : (frecuentes.data?.length ?? 0) === 0 ? (
          <View className="bg-slate-100 p-4 rounded-3xl">
            <Text className="text-slate-500 text-sm text-center font-medium">Sin datos aún</Text>
          </View>
        ) : (
          <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {frecuentes.data!.map((c: ClienteFrecuente, i: number) => (
              <View
                key={c.idCliente}
                className={`flex-row items-center px-5 py-4 ${i < frecuentes.data!.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${i === 0 ? 'bg-amber-100' : i === 1 ? 'bg-slate-200' : i === 2 ? 'bg-orange-100' : 'bg-slate-100'}`}>
                  <Text className={`font-black text-base ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-600' : i === 2 ? 'text-orange-600' : 'text-slate-500'}`}>#{i + 1}</Text>
                </View>
                <Text className="flex-1 font-bold text-slate-800 text-base">{c.nombres}</Text>
                <View className="bg-slate-100 px-3 py-1.5 rounded-xl flex-row items-center">
                  <Users size={14} color="#64748B" />
                  <Text className="text-slate-600 text-xs ml-1.5 font-bold">
                    {c.totalPedidos}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
