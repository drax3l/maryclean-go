import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useAuthStore } from '../../core/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../core/api/axios';
import { User, Shield, LogOut, Building2, BarChart3, Clock } from 'lucide-react-native';

export default function PerfilScreen() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const isAdmin = user?.rol === 'admin';

  // Cierre de caja (solo admin)
  const hoy = new Date().toISOString().split('T')[0];
  const { data: cierre, isLoading: loadingCierre, refetch: refetchCierre } = useQuery({
    queryKey: ['cierreCaja', hoy],
    queryFn: async () => {
      const res = await api.get(`/reportes/cierre-caja?fecha=${hoy}`);
      return res.data.data;
    },
    enabled: isAdmin, // Solo se ejecuta si es admin
  });

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, salir', style: 'destructive', onPress: logout },
      ],
    );
  };

  const ROL_COLORS: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    cajero: 'bg-blue-100 text-blue-700',
    recepcionista: 'bg-green-100 text-green-700',
  };
  const rolColors = ROL_COLORS[user?.rol ?? ''] ?? 'bg-gray-100 text-gray-700';
  const [rolBg, rolTxt] = rolColors.split(' ');

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 60 }}>

      {/* ── Avatar y datos Premium ── */}
      <View className="bg-slate-900 px-6 pt-10 pb-16 items-center rounded-b-[40px] shadow-sm">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4 border-4 border-slate-800">
          <Text className="text-blue-600 text-4xl font-black">
            {user?.nombres?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text className="text-white text-2xl font-black tracking-tight">{user?.nombres ?? '—'}</Text>
        <View className={`mt-3 px-4 py-1.5 rounded-full ${rolBg}`}>
          <Text className={`font-black text-xs uppercase tracking-wider ${rolTxt}`}>{user?.rol ?? '—'}</Text>
        </View>
      </View>

      {/* ── Info del empleado ── */}
      <View className="mx-4 -mt-8 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-6">
        <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
          <View className="bg-sky-100 p-2 rounded-xl mr-3">
            <Building2 color="#0EA5E9" size={18} strokeWidth={2.5} />
          </View>
          <Text className="text-slate-500 font-bold uppercase tracking-wider text-xs">Sucursal asignada</Text>
          <Text className="ml-auto font-black text-slate-800 tracking-tight text-base">{user?.sucursal ?? '—'}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="bg-indigo-100 p-2 rounded-xl mr-3">
            <Shield color="#4F46E5" size={18} strokeWidth={2.5} />
          </View>
          <Text className="text-slate-500 font-bold uppercase tracking-wider text-xs">Nivel de Acceso</Text>
          <Text className="ml-auto font-black text-slate-800 tracking-tight text-base capitalize">{user?.rol ?? '—'}</Text>
        </View>
      </View>

      {/* ── Cierre de Caja (solo admin) ── */}
      {isAdmin && (
        <View className="mx-4 mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-indigo-100 p-2 rounded-xl mr-3">
              <BarChart3 color="#4F46E5" size={20} strokeWidth={2.5} />
            </View>
            <Text className="text-xl font-black text-slate-800 tracking-tight">Cierre de Caja</Text>
            <Text className="ml-auto text-slate-400 font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg">{hoy}</Text>
          </View>

          {loadingCierre ? (
            <ActivityIndicator color="#4F46E5" className="my-4" />
          ) : !cierre ? (
            <View className="bg-slate-100 rounded-3xl p-6 items-center">
              <Text className="text-slate-500 font-bold mb-2">Sin datos para hoy</Text>
              <TouchableOpacity onPress={() => refetchCierre()} className="bg-indigo-500 px-4 py-2 rounded-xl">
                <Text className="text-white font-black text-xs uppercase tracking-wider">Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <View className="bg-indigo-50 px-5 py-4 flex-row justify-between items-center border-b border-indigo-100/50">
                <View className="flex-row items-center">
                  <Clock size={16} color="#4F46E5" strokeWidth={2.5} />
                  <Text className="text-indigo-800 font-black ml-2">{cierre.total_operaciones} txns</Text>
                </View>
                <Text className="text-indigo-800 font-black text-lg">Total: S/ {parseFloat(cierre.total_general).toFixed(2)}</Text>
              </View>

              {/* Desglose por método */}
              {(cierre.desglose ?? []).map((d: any, i: number) => (
                <View
                  key={i}
                  className={`px-5 py-4 flex-row justify-between items-center ${i < cierre.desglose.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <View>
                    <Text className="font-black text-slate-700 text-base mb-0.5">{d.metodo}</Text>
                    <Text className="text-slate-400 text-xs font-bold">{d.cantidadTransacciones} transacciones</Text>
                  </View>
                  <Text className="font-black text-emerald-600 text-lg">
                    S/ {parseFloat(d.total_ingresos).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Botón de logout ── */}
      <View className="mx-4 mt-auto">
        <TouchableOpacity
          className="bg-red-50 border border-red-100 py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color="#EF4444" size={20} strokeWidth={2.5} />
          <Text className="text-red-500 font-black tracking-tight text-base ml-2 uppercase">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
