import { api } from '../../../core/api/axios';

export interface PrendaCatalogo {
  idPrenda: string;
  nombrePrenda: string;
  precio: string;
  estado: string;
}

export interface ServicioCategoria {
  idServicio: string;
  nombre: string;
  tiempoEstimado?: string;
  prendas: PrendaCatalogo[];
}

export const getCatalogoAgrupado = async (): Promise<ServicioCategoria[]> => {
  try {
    const response = await api.get('/servicios');
    const servicios: ServicioCategoria[] = response.data.data || [];
    
    // Filtramos para devolver solo las prendas activas (estado === "1")
    const catalogoFiltrado = servicios.map(servicio => ({
      ...servicio,
      prendas: servicio.prendas.filter(p => p.estado === '1' || p.estado === 1)
    }));
    
    // Y opcionalmente quitamos las categorías que se quedaron vacías
    return catalogoFiltrado.filter(servicio => servicio.prendas.length > 0);
  } catch (error: any) {
    console.log("🔥 ERROR EN CATÁLOGO:", error.message);
    throw error;
  }
};
