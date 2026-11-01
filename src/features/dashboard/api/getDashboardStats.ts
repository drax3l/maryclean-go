import { api } from '../../../core/api/axios';

export interface DashboardStats {
  pedidos_hoy: string | number;
  ingresos_hoy: string | number;
  pedidos_activos: string | number;
  pendientes_cobro: string | number;
  fecha?: string;
}

export interface EntregaUrgente {
  idPedido: string;
  codigoTicket: string;
  cliente: string;
  telefonoCliente?: string;
  estado: string;
  fechaRecepcion: string;
}

export interface ClienteFrecuente {
  idCliente: string;
  nombres: string;
  totalPedidos: string | number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/reportes/dashboard');
  return response.data.data;
};

export const getEntregasUrgentes = async (): Promise<EntregaUrgente[]> => {
  const response = await api.get('/reportes/entregas-urgentes?limite=5');
  return response.data.data || [];
};

export const getClientesFrecuentes = async (): Promise<ClienteFrecuente[]> => {
  const response = await api.get('/reportes/clientes-frecuentes?limite=5');
  return response.data.data || [];
};
