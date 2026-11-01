import { api } from '../../../core/api/axios';

export interface Cliente {
  idCliente: string;
  documento: string;
  nombres: string;
  telefono: string;
  direccion: string;
}

export const getClientes = async (searchQuery: string = ''): Promise<Cliente[]> => {
  // Según backend_manual.md: GET /api/v1/clientes?q=texto
  const response = await api.get(`/clientes${searchQuery ? `?q=${searchQuery}` : ''}`);
  
  // Asumiremos que viene dentro de data.clientes o data.data
  return response.data.data.clientes || response.data.data || [];
};

export const createCliente = async (clienteData: Omit<Cliente, 'idCliente'>): Promise<{ idCliente: number }> => {
  const response = await api.post('/clientes', clienteData);
  return response.data.data; // Debería devolver { idCliente: X }
};
