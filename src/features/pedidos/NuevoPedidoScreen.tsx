import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Linking
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BottomSheet, { BottomSheetView, BottomSheetSectionList } from '@gorhom/bottom-sheet';
import { getClientes, createCliente, Cliente } from '../clientes/api/clientesApi';
import { getCatalogoAgrupado, PrendaCatalogo } from '../configuracion/api/catalogoApi';
import { createPedido, PedidoCreationData } from './api/pedidosApi';
import { Search, Plus, Trash2, CheckCircle, UserPlus, ShoppingBag } from 'lucide-react-native';

// Tipo del carrito
interface CartItem {
  prenda: PrendaCatalogo;
  cantidad: number;
}

export default function NuevoPedidoScreen() {
  const queryClient = useQueryClient();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '85%'], []);

  // ─── Estado del cliente ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [clientesBusqueda, setClientesBusqueda] = useState<Cliente[]>([]); // Lista de resultados
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombres: '',
    telefono: '',
    direccion: '',
  });

  // ─── Estado del carrito ──────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);

  // ─── Catálogo (se carga al montar la pantalla) ───────────────────────────
  const {
    data: catalogoAgrupado,
    isLoading: isLoadingCatalogo,
    isError: isErrorCatalogo,
  } = useQuery({
    queryKey: ['catalogo'],
    queryFn: getCatalogoAgrupado,
  });

  // Convertir el catálogo en secciones para BottomSheetSectionList
  const sections = useMemo(() => {
    if (!catalogoAgrupado) return [];
    return catalogoAgrupado.map((servicio) => ({
      title: servicio.nombre,
      data: servicio.prendas,
    }));
  }, [catalogoAgrupado]);

  // ─── Búsqueda con debounce ───────────────────────────────────────────────
  // El backend ya hace coincidencias parciales con ?q=texto
  // Nosotros solo mandamos el texto 600ms después de que el usuario deje de escribir
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Si hay un cliente ya seleccionado o el campo está vacío, no buscamos
    if (!searchQuery.trim() || selectedCliente) return;

    // Esperamos 600ms antes de lanzar la petición
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const lista = await getClientes(searchQuery.trim());
        if (lista.length === 1) {
          setClientesBusqueda([]);
          setSelectedCliente(lista[0]);
          setIsNewClient(false);
        } else if (lista.length > 1) {
          setClientesBusqueda(lista);
          setSelectedCliente(null);
          setIsNewClient(false);
        } else {
          // Sin resultados: mostramos la lista vacía (no forzamos formulario todavía)
          setClientesBusqueda([]);
          setSelectedCliente(null);
          setIsNewClient(false);
        }
      } catch (err: any) {
        console.log('Error búsqueda cliente:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    // Limpiar el timer anterior si el usuario sigue escribiendo
    return () => clearTimeout(timer);
  }, [searchQuery]); // Se ejecuta cada vez que cambia el texto

  // ─── Mutaciones ──────────────────────────────────────────────────────────
  const mutationCreateCliente = useMutation({ mutationFn: createCliente });
  const mutationCreatePedido  = useMutation({ mutationFn: createPedido });

  // ─── Buscar cliente ──────────────────────────────────────────────────────
  // El botón de lupa ahora sirve para buscar manualmente si el empleado quiere
  // forzar la búsqueda sin esperar el debounce (útil si ya escribió todo el DNI)
  const handleSearchManual = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Atención', 'Ingresa un DNI, teléfono o nombre para buscar.');
      return;
    }
    setIsSearching(true);
    try {
      const lista = await getClientes(searchQuery.trim());
      if (lista.length === 1) {
        setClientesBusqueda([]);
        setSelectedCliente(lista[0]);
        setIsNewClient(false);
      } else if (lista.length > 1) {
        setClientesBusqueda(lista);
        setSelectedCliente(null);
      } else {
        setClientesBusqueda([]);
        setSelectedCliente(null);
        setIsNewClient(true);
        Alert.alert('Sin resultados', 'No se encontró ningún cliente. Completa el formulario para registrarlo.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClientesBusqueda([]); // Limpiamos la lista de resultados
    setIsNewClient(false);
  };

  // ─── Carrito ─────────────────────────────────────────────────────────────
  const addToCart = (prenda: PrendaCatalogo) => {
    setCart((prev) => {
      const existe = prev.find((c) => c.prenda.idPrenda === prenda.idPrenda);
      if (existe) {
        return prev.map((c) =>
          c.prenda.idPrenda === prenda.idPrenda
            ? { ...c, cantidad: c.cantidad + 1 }
            : c,
        );
      }
      return [...prev, { prenda, cantidad: 1 }];
    });
    // No cerramos el bottom sheet automáticamente para que el usuario
    // pueda seguir agregando prendas
  };

  const updateCantidad = (idPrenda: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.prenda.idPrenda !== idPrenda) return c;
        const nuevaCant = c.cantidad + delta;
        return nuevaCant > 0 ? { ...c, cantidad: nuevaCant } : c;
      }),
    );
  };

  const removeFromCart = (idPrenda: string) => {
    setCart((prev) => prev.filter((c) => c.prenda.idPrenda !== idPrenda));
  };

  const totalCart = cart.reduce(
    (acc, c) => acc + parseFloat(c.prenda.precio) * c.cantidad,
    0,
  );

  // ─── Confirmar pedido ────────────────────────────────────────────────────
  const handleCheckout = async () => {
    // Validaciones previas
    if (cart.length === 0) {
      return Alert.alert('Error', 'Agrega al menos una prenda al pedido.');
    }
    if (!selectedCliente && !isNewClient) {
      return Alert.alert('Error', 'Busca o registra un cliente primero.');
    }
    if (isNewClient && (!newClientData.nombres.trim() || !newClientData.telefono.trim())) {
      return Alert.alert('Error', 'El nombre y teléfono del cliente son obligatorios.');
    }

    try {
      let finalIdCliente: number;

      // ── 1. Si es cliente nuevo, lo creamos primero ──
      if (isNewClient) {
        const resCliente = await mutationCreateCliente.mutateAsync({
          nombres:   newClientData.nombres.trim(),
          documento: searchQuery.trim(),
          telefono:  newClientData.telefono.trim(),
          direccion: newClientData.direccion.trim(),
        });
        // El backend devuelve { idCliente: <número> }
        finalIdCliente = Number(resCliente.idCliente);
      } else {
        finalIdCliente = Number(selectedCliente!.idCliente);
      }

      // ── 2. Construimos el payload exacto que espera CodeIgniter ──
      const pedidoPayload: PedidoCreationData = {
        idCliente: finalIdCliente,
        detalles: cart.map((c) => ({
          idPrenda:       Number(c.prenda.idPrenda),
          cantidad:       c.cantidad,
          precioUnitario: parseFloat(c.prenda.precio),
        })),
      };

      console.log('📦 Payload pedido:', JSON.stringify(pedidoPayload, null, 2));

      await mutationCreatePedido.mutateAsync(pedidoPayload);

      // ── 3. Éxito: invalida la lista y muestra alerta con WhatsApp ──
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });

      const nombreCliente = isNewClient
        ? newClientData.nombres
        : selectedCliente?.nombres ?? '';
      const telefonoCliente = isNewClient
        ? newClientData.telefono
        : selectedCliente?.telefono ?? '';

      Alert.alert(
        '✅ Pedido creado',
        `Total: S/ ${totalCart.toFixed(2)}`,
        [
          {
            text: 'Solo cerrar',
            style: 'cancel',
            onPress: resetForm,
          },
          {
            text: '📱 Enviar por WhatsApp',
            onPress: () => {
              const detalle = cart
                .map((c) => `  • ${c.prenda.nombrePrenda} x${c.cantidad}`)
                .join('\n');
              const mensaje =
                `Hola *${nombreCliente}* 👋\n` +
                `Tu pedido en *MaryClean* fue registrado exitosamente.\n\n` +
                `*Prendas:*\n${detalle}\n\n` +
                `*Total: S/ ${totalCart.toFixed(2)}*\n` +
                `¡Gracias por confiar en nosotros! 🧺`;
              Linking.openURL(
                `whatsapp://send?phone=51${telefonoCliente}&text=${encodeURIComponent(mensaje)}`,
              );
              resetForm();
            },
          },
        ],
      );
    } catch (error: any) {
      // Mostrar el error exacto que manda CodeIgniter
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors ||
        error.message ||
        'Error desconocido';
      console.log('🔴 Error checkout:', JSON.stringify(error.response?.data));
      Alert.alert('Error al guardar el pedido', String(msg));
    }
  };

  // ─── Reset ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setSearchQuery('');
    setClientesBusqueda([]);
    setSelectedCliente(null);
    setIsNewClient(false);
    setNewClientData({ nombres: '', telefono: '', direccion: '' });
    setCart([]);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      {/* ── Contenido scrolleable ── */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECCIÓN 1: CLIENTE */}
        <Text className="text-xl font-bold text-primary mb-3">1. Cliente</Text>

        {/* Buscador */}
        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 bg-white border border-gray-300 rounded-l-xl px-4 py-3 text-secondary"
            placeholder="DNI, teléfono o nombre..."
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (!t) {
                setSelectedCliente(null);
                setIsNewClient(false);
                setClientesBusqueda([]);
              }
            }}
            returnKeyType="search"
            onSubmitEditing={handleSearchManual}
          />
          <TouchableOpacity
            className="bg-primary px-4 rounded-r-xl justify-center"
            onPress={handleSearchManual}
            disabled={isSearching}
          >
            {isSearching
              ? <ActivityIndicator color="#fff" size="small" />
              : <Search color="#fff" size={20} />}
          </TouchableOpacity>
        </View>

        {/* Lista de resultados múltiples — el empleado elige */}
        {clientesBusqueda.length > 1 && (
          <View className="mb-4 bg-white rounded-xl border border-blue-200 overflow-hidden">
            <View className="bg-blue-50 px-4 py-2">
              <Text className="text-blue-700 font-bold text-sm">
                {clientesBusqueda.length} resultados encontrados — ¿Cuál es el cliente?
              </Text>
            </View>
            {clientesBusqueda.map((cliente, index) => (
              <TouchableOpacity
                key={cliente.idCliente}
                className={`px-4 py-3 flex-row justify-between items-center ${
                  index < clientesBusqueda.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => handleSelectCliente(cliente)}
              >
                <View>
                  <Text className="font-bold text-primary">{cliente.nombres}</Text>
                  <Text className="text-secondary text-sm">
                    📞 {cliente.telefono}  •  📄 {cliente.documento}
                  </Text>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-600 text-xs font-bold">Seleccionar</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="px-4 py-3 border-t border-gray-100 items-center"
              onPress={() => {
                setClientesBusqueda([]);
                setIsNewClient(true);
              }}
            >
              <Text className="text-orange-500 font-bold text-sm">
                ✚ No aparece — Registrar nuevo cliente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cliente seleccionado */}
        {selectedCliente && !isNewClient && (
          <View className="bg-green-50 p-4 rounded-xl border border-green-200 mb-5 flex-row items-center">
            <CheckCircle color="#10B981" size={24} />
            <View className="ml-3">
              <Text className="font-bold text-green-800">{selectedCliente.nombres}</Text>
              <Text className="text-green-600 text-sm">📞 {selectedCliente.telefono}</Text>
            </View>
            <TouchableOpacity
              className="ml-auto"
              onPress={() => { setSelectedCliente(null); setIsNewClient(false); setSearchQuery(''); }}
            >
              <Text className="text-red-400 text-xs">✕ Cambiar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Formulario nuevo cliente */}
        {isNewClient && (
          <View className="bg-white p-4 rounded-xl border border-blue-100 mb-5 shadow-sm">
            <View className="flex-row items-center mb-3">
              <UserPlus color="#0EA5E9" size={20} />
              <Text className="font-bold text-primary ml-2">Registrar nuevo cliente</Text>
            </View>
            <TextInput
              className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 mb-3 text-secondary"
              placeholder="Nombres y apellidos *"
              value={newClientData.nombres}
              onChangeText={(t) => setNewClientData({ ...newClientData, nombres: t })}
            />
            <TextInput
              className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 mb-3 text-secondary"
              placeholder="Teléfono WhatsApp *"
              keyboardType="phone-pad"
              value={newClientData.telefono}
              onChangeText={(t) => setNewClientData({ ...newClientData, telefono: t })}
            />
            <TextInput
              className="bg-slate-50 border border-gray-200 rounded-lg px-4 py-2 text-secondary"
              placeholder="Dirección (opcional)"
              value={newClientData.direccion}
              onChangeText={(t) => setNewClientData({ ...newClientData, direccion: t })}
            />
          </View>
        )}

        {/* SECCIÓN 2: PRENDAS */}
        <View className="flex-row justify-between items-center mt-2 mb-3">
          <Text className="text-xl font-bold text-primary">2. Prendas</Text>
          <TouchableOpacity
            className="flex-row items-center bg-blue-100 px-4 py-2 rounded-full"
            onPress={() => bottomSheetRef.current?.snapToIndex(0)}
          >
            <Plus color="#0EA5E9" size={16} />
            <Text className="text-blue-600 font-bold text-sm ml-1">Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Carrito vacío */}
        {cart.length === 0 ? (
          <View className="bg-slate-50 p-8 rounded-xl border border-dashed border-gray-300 items-center mb-6">
            <ShoppingBag color="#CBD5E1" size={36} />
            <Text className="text-secondary text-center mt-2">
              Pulsa "Agregar" para elegir prendas
            </Text>
          </View>
        ) : (
          <View className="mb-6">
            {cart.map((item) => (
              <View
                key={item.prenda.idPrenda}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex-row items-center mb-2"
              >
                {/* Info */}
                <View className="flex-1">
                  <Text className="font-bold text-primary">{item.prenda.nombrePrenda}</Text>
                  <Text className="text-secondary text-xs mt-0.5">
                    S/ {parseFloat(item.prenda.precio).toFixed(2)} c/u
                  </Text>
                </View>

                {/* Controles cantidad */}
                <View className="flex-row items-center bg-slate-100 rounded-lg mr-3">
                  <TouchableOpacity
                    className="px-3 py-2"
                    onPress={() => updateCantidad(item.prenda.idPrenda, -1)}
                  >
                    <Text className="text-xl font-bold text-slate-500 leading-none">−</Text>
                  </TouchableOpacity>
                  <Text className="font-bold text-primary w-6 text-center">
                    {item.cantidad}
                  </Text>
                  <TouchableOpacity
                    className="px-3 py-2"
                    onPress={() => updateCantidad(item.prenda.idPrenda, 1)}
                  >
                    <Text className="text-xl font-bold text-slate-500 leading-none">+</Text>
                  </TouchableOpacity>
                </View>

                {/* Subtotal y eliminar */}
                <View className="items-end">
                  <Text className="font-bold text-green-600 text-sm">
                    S/ {(parseFloat(item.prenda.precio) * item.cantidad).toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    className="mt-1"
                    onPress={() => removeFromCart(item.prenda.idPrenda)}
                  >
                    <Trash2 color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Total */}
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <Text className="text-base font-bold text-secondary">Total estimado</Text>
              <Text className="text-2xl font-bold text-green-600">
                S/ {totalCart.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* BOTÓN CONFIRMAR */}
        <TouchableOpacity
          className={`w-full py-4 rounded-2xl items-center ${
            cart.length > 0 && (selectedCliente || isNewClient)
              ? 'bg-primary'
              : 'bg-gray-300'
          }`}
          onPress={handleCheckout}
          disabled={
            cart.length === 0 ||
            (!selectedCliente && !isNewClient) ||
            mutationCreatePedido.isPending ||
            mutationCreateCliente.isPending
          }
        >
          {mutationCreatePedido.isPending || mutationCreateCliente.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Confirmar Pedido · S/ {totalCart.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── BOTTOM SHEET: Catálogo ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: '#ffffff', borderRadius: 24 }}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text className="text-xl font-bold text-primary mb-3 pt-2">
            Selecciona una prenda
          </Text>

          {isLoadingCatalogo && (
            <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 20 }} />
          )}

          {isErrorCatalogo && (
            <View className="bg-red-50 p-4 rounded-xl items-center">
              <Text className="text-red-500 font-bold">No se pudo cargar el catálogo.</Text>
            </View>
          )}

          {!isLoadingCatalogo && !isErrorCatalogo && (
            <BottomSheetSectionList
              sections={sections}
              keyExtractor={(item: any) => item.idPrenda}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <View className="items-center mt-10">
                  <Text className="text-secondary">No hay servicios activos.</Text>
                </View>
              }
              renderSectionHeader={({ section: { title } }) => (
                <View className="bg-blue-50 px-3 py-2 rounded-lg mb-1 mt-3">
                  <Text className="font-bold text-blue-700">{title}</Text>
                </View>
              )}
              renderItem={({ item }: { item: any }) => {
                const enCarrito = cart.find((c) => c.prenda.idPrenda === item.idPrenda);
                return (
                  <TouchableOpacity
                    className="flex-row justify-between items-center py-3 px-2 border-b border-gray-100"
                    onPress={() => addToCart(item)}
                  >
                    <View>
                      <Text className="font-medium text-primary">{item.nombrePrenda}</Text>
                      <Text className="text-green-600 text-sm font-bold">
                        S/ {parseFloat(item.precio).toFixed(2)}
                      </Text>
                    </View>
                    <View className={`flex-row items-center px-3 py-1.5 rounded-full ${enCarrito ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Plus color={enCarrito ? '#10B981' : '#0EA5E9'} size={14} />
                      <Text className={`ml-1 text-xs font-bold ${enCarrito ? 'text-green-600' : 'text-blue-600'}`}>
                        {enCarrito ? `x${enCarrito.cantidad}` : 'Agregar'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
