import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, Linking
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PedidosStackParamList } from '../../core/navigation/stacks/PedidosStack';
import { api } from '../../core/api/axios';
import { updatePedidoEstado } from './api/pedidosApi';
import {
  Package, User, CreditCard, Clock,
  CheckCircle, Truck, XCircle, Phone
} from 'lucide-react-native';

type Props = NativeStackScreenProps<PedidosStackParamList, 'PedidoDetalle'>;

// ── Tipos de la respuesta del backend ────────────────────────────────────────
interface DetalleItem {
  idDetalle: string;
  nombrePrenda: string;
  cantidad: string;
  precioUnitario: string;
  importe: string;
}

interface PagoItem {
  idPago: string;
  monto: string;
  metodo: string;
  fechaPago: string;
}

interface PedidoDetalle {
  idPedido: string;
  codigoTicket: string;
  estado: string;
  total: string;
  fechaRecepcion: string;
  cliente: { idCliente: string; nombres: string; documento: string; telefono?: string };
  empleado: { nombres: string };
}

interface SaldoInfo {
  total: string;
  total_pagado: string;
  saldo_pendiente: string;
  estado: string;
}

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Yape/Plin'] as const;

const ESTADOS_FLUJO = ['Recibido', 'En Proceso', 'Listo', 'Entregado'] as const;

const ESTADO_ICON: Record<string, React.ReactNode> = {
  'Recibido':   <Package color="#0EA5E9" size={16} />,
  'En Proceso': <Clock color="#F59E0B" size={16} />,
  'Listo':      <CheckCircle color="#10B981" size={16} />,
  'Entregado':  <Truck color="#6366F1" size={16} />,
  'Cancelado':  <XCircle color="#EF4444" size={16} />,
};

export default function PedidoDetalleScreen({ route }: Props) {
  const { idPedido, codigoTicket } = route.params;
  const queryClient = useQueryClient();

  // ── Datos del pedido ──────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['pedidoDetalle', idPedido],
    queryFn: async () => {
      const res = await api.get(`/pedidos/${idPedido}`);
      return res.data.data as {
        pedido: PedidoDetalle;
        detalles: DetalleItem[];
        pagos: PagoItem[];
      };
    },
  });

  // ── Saldo pendiente ───────────────────────────────────────────────────────
  const { data: saldo, refetch: refetchSaldo } = useQuery({
    queryKey: ['saldoPedido', idPedido],
    queryFn: async () => {
      const res = await api.get(`/pagos/pedido/${idPedido}`);
      return res.data.data as SaldoInfo;
    },
  });

  // ── Cambiar estado ────────────────────────────────────────────────────────
  const mutEstado = useMutation({
    mutationFn: updatePedidoEstado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidoDetalle', idPedido] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  // ── Registrar pago ────────────────────────────────────────────────────────
  const mutPago = useMutation({
    mutationFn: async ({ monto, metodo }: { monto: number; metodo: string }) => {
      const res = await api.post('/pagos', {
        idPedido: Number(idPedido),
        monto,
        metodo,
      });
      return res.data;
    },
    onSuccess: () => {
      refetchSaldo();
      queryClient.invalidateQueries({ queryKey: ['pedidoDetalle', idPedido] });
    },
  });

  const handleCobrar = (metodo: string) => {
    const pendiente = parseFloat(saldo?.saldo_pendiente ?? '0');
    if (pendiente <= 0) return;

    Alert.alert(
      `Cobrar con ${metodo}`,
      `¿Registrar pago de S/ ${pendiente.toFixed(2)} por ${metodo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await mutPago.mutateAsync({ monto: pendiente, metodo });
              // Enviar WhatsApp de confirmación
              const tel = data?.pedido?.cliente?.telefono;
              const nombre = data?.pedido?.cliente?.nombres ?? '';
              if (tel) {
                const msg =
                  `Hola *${nombre}*, se registró tu pago de *S/ ${pendiente.toFixed(2)}* ` +
                  `(${metodo}) para el pedido *${codigoTicket}*.\n¡Gracias por usar MaryClean! 🧺`;
                Alert.alert('¡Pago registrado!', '¿Enviar recibo por WhatsApp?', [
                  { text: 'No', style: 'cancel' },
                  { text: 'Enviar', onPress: () => Linking.openURL(`whatsapp://send?phone=51${tel}&text=${encodeURIComponent(msg)}`) },
                ]);
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message ?? err.message);
            }
          },
        },
      ],
    );
  };

  const handleCambiarEstado = (nuevoEstado: string) => {
    Alert.alert('Cambiar estado', `¿Pasar a "${nuevoEstado}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => mutEstado.mutate({ id: idPedido, estado: nuevoEstado }) },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!data) return null;

  const { pedido, detalles, pagos } = data;
  const saldoPendiente = parseFloat(saldo?.saldo_pendiente ?? '0');
  const estadoActualIdx = ESTADOS_FLUJO.indexOf(pedido.estado as any);

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 60 }}>

      {/* ── Encabezado Premium ── */}
      <View className="bg-slate-900 px-6 pt-8 pb-8 rounded-b-[40px] shadow-sm mb-4">
        <Text className="text-white/60 font-semibold uppercase tracking-widest text-xs mb-1">
          Código de Ticket
        </Text>
        <Text className="text-white text-3xl font-black tracking-tight">{pedido.codigoTicket}</Text>
        
        <View className="flex-row items-center mt-4 bg-white/10 self-start px-3 py-1.5 rounded-full">
          {ESTADO_ICON[pedido.estado]}
          <Text className="text-white font-bold text-sm ml-2">{pedido.estado}</Text>
        </View>
        <Text className="text-slate-400 text-xs mt-3 font-medium">
          Recibido: {new Date(pedido.fechaRecepcion).toLocaleDateString('es-PE')}
        </Text>
      </View>

      {/* ── Info del cliente ── */}
      <View className="mx-4 mt-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
          <View className="bg-sky-100 p-2 rounded-xl mr-3">
            <User color="#0EA5E9" size={20} strokeWidth={2.5} />
          </View>
          <Text className="text-lg font-black text-slate-800 tracking-tight">Datos del Cliente</Text>
        </View>
        
        <Text className="text-slate-700 font-bold text-base mb-1">{pedido.cliente?.nombres}</Text>
        {pedido.cliente?.documento && (
          <Text className="text-slate-500 font-medium text-sm">DNI: {pedido.cliente.documento}</Text>
        )}
        {pedido.cliente?.telefono && (
          <TouchableOpacity
            className="flex-row items-center mt-3 bg-emerald-50 self-start px-3 py-2 rounded-xl"
            onPress={() => Linking.openURL(`tel:${pedido.cliente.telefono}`)}
          >
            <Phone size={14} color="#059669" strokeWidth={2.5} />
            <Text className="text-emerald-700 text-sm ml-2 font-bold">{pedido.cliente.telefono}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Prendas / Detalles ── */}
      <View className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
          <View className="bg-indigo-100 p-2 rounded-xl mr-3">
            <Package color="#4F46E5" size={20} strokeWidth={2.5} />
          </View>
          <Text className="text-lg font-black text-slate-800 tracking-tight">Prendas / Servicios</Text>
        </View>
        
        {detalles.map((d, index) => (
          <View key={d.idDetalle} className={`flex-row justify-between py-3 ${index < detalles.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <View>
              <Text className="text-slate-700 font-bold mb-0.5">{d.nombrePrenda}</Text>
              <View className="flex-row items-center">
                <View className="bg-slate-100 px-2 py-0.5 rounded mr-2">
                  <Text className="text-slate-500 text-xs font-bold">x{d.cantidad}</Text>
                </View>
                <Text className="text-slate-400 text-xs font-medium">S/ {parseFloat(d.precioUnitario).toFixed(2)} c/u</Text>
              </View>
            </View>
            <Text className="font-black text-slate-800 self-center">S/ {parseFloat(d.importe).toFixed(2)}</Text>
          </View>
        ))}
        <View className="flex-row justify-between mt-4 pt-4 border-t border-slate-100 items-center">
          <Text className="font-bold text-slate-500 uppercase tracking-wider text-xs">Total del pedido</Text>
          <Text className="text-2xl font-black text-emerald-600 tracking-tight">S/ {parseFloat(pedido.total).toFixed(2)}</Text>
        </View>
      </View>

      {/* ── Panel de Cobro ── */}
      {saldoPendiente > 0 && (
        <View className="mx-4 mt-4 bg-amber-50 rounded-3xl p-5 shadow-sm border border-amber-200">
          <View className="flex-row items-center mb-4">
            <View className="bg-amber-100 p-2 rounded-xl mr-3">
              <CreditCard color="#D97706" size={20} strokeWidth={2.5} />
            </View>
            <Text className="text-lg font-black text-amber-900 tracking-tight">Cobrar Saldo</Text>
          </View>
          
          <View className="bg-white rounded-2xl p-4 mb-4 flex-row justify-between items-center shadow-sm">
            <Text className="text-slate-500 font-bold">Monto Pendiente</Text>
            <Text className="text-2xl font-black text-rose-600">S/ {saldoPendiente.toFixed(2)}</Text>
          </View>
          
          <Text className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">Elige el método de pago:</Text>
          <View className="flex-row gap-2">
            {METODOS_PAGO.map(m => (
              <TouchableOpacity
                key={m}
                className="flex-1 bg-amber-600 py-3 rounded-2xl items-center shadow-sm shadow-amber-900/20"
                onPress={() => handleCobrar(m)}
                disabled={mutPago.isPending}
                activeOpacity={0.8}
              >
                <Text className="text-white font-black text-xs uppercase tracking-wider">{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {saldoPendiente === 0 && (
        <View className="mx-4 mt-4 bg-emerald-50 rounded-3xl p-5 border border-emerald-100 flex-row items-center shadow-sm">
          <View className="bg-emerald-100 p-2 rounded-full mr-3">
            <CheckCircle color="#059669" size={24} strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-emerald-800 font-black tracking-tight text-base">Pedido pagado</Text>
            <Text className="text-emerald-600 text-sm font-medium mt-0.5">Saldo en cero</Text>
          </View>
        </View>
      )}

      {/* ── Historial de pagos ── */}
      {pagos.length > 0 && (
        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="font-bold text-primary mb-3">Historial de Pagos</Text>
          {pagos.map(p => (
            <View key={p.idPago} className="flex-row justify-between py-2 border-b border-gray-50">
              <View>
                <Text className="text-secondary font-medium">{p.metodo}</Text>
                <Text className="text-slate-400 text-xs">
                  {new Date(p.fechaPago).toLocaleDateString('es-PE')}
                </Text>
              </View>
              <Text className="font-bold text-green-600">S/ {parseFloat(p.monto).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Cambiar Estado ── */}
      <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
        <Text className="font-bold text-primary mb-3">Cambiar Estado</Text>
        <View className="flex-row flex-wrap gap-2">
          {ESTADOS_FLUJO.filter(e => e !== pedido.estado && e !== 'Cancelado').map(e => (
            <TouchableOpacity
              key={e}
              className="bg-slate-100 px-4 py-2 rounded-lg"
              onPress={() => handleCambiarEstado(e)}
              disabled={mutEstado.isPending}
            >
              <Text className="text-secondary font-bold text-sm">{e}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            className="bg-red-100 px-4 py-2 rounded-lg"
            onPress={() => handleCambiarEstado('Cancelado')}
            disabled={mutEstado.isPending}
          >
            <Text className="text-red-500 font-bold text-sm">Cancelar pedido</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}
