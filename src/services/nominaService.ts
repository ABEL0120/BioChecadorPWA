import { apiClient } from "../api/apiClient";
import { ApiResponse } from "../types/api";

export interface ReciboNomina {
  anio: number;
  proceso: number;
  fechaInicio: string;
  fechaTermino: string;
  fechaPago: string;
  nombreArchivo: string;
  tienePdf: boolean;
  tieneXml: boolean;
}

export const nominaService = {
  obtenerRecibos: async (
    compania: number,
    m103: number,
    fechaInicial?: string,
    fechaFinal?: string
  ): Promise<ApiResponse<ReciboNomina[]>> => {
    const params = new URLSearchParams();
    if (fechaInicial) params.append("fechaInicial", fechaInicial);
    if (fechaFinal) params.append("fechaFinal", fechaFinal);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient.get<ApiResponse<ReciboNomina[]>>(
      `/nomina/recibos/${compania}/${m103}${queryString}`
    );
    return response.data;
  },

  descargarArchivo: async (
    anio: number,
    proceso: number,
    tipo: "pdf" | "xml",
    archivo: string
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/nomina/descargar/${anio}/${proceso}/${tipo}/${encodeURIComponent(archivo)}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};
