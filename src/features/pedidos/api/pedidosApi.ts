import { api } from '../../../core/api/axios';

export interface Pedido {
  idPedido: string;
  codigoTicket: string;
  cliente_nombre: string;
  estado: string;
  total: string;
  fechaRecepcion: string;
  idSucursal: string;
}

export const getPedidos = async (estado?: string): Promise<Pedido[]> => {
  const params = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  const response = await api.get(`/pedidos${params}`);
  return response.data.data.pedidos || [];
};

export const updatePedidoEstado = async ({ id, estado }: { id: string; estado: string }) => {
  // PUT /api/v1/pedidos/{id}/estado - { "estado": "Lavado" }
  const response = await api.put(`/pedidos/${id}/estado`, { estado });
  return response.data;
};

export interface PedidoCreationData {
  idCliente: number;
  detalles: {
    idPrenda: number;
    cantidad: number;
    precioUnitario: number;
  }[];
}

export const createPedido = async (pedidoData: PedidoCreationData) => {
  const response = await api.post('/pedidos', pedidoData);
  return response.data.data;
};
