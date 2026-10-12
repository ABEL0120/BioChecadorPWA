import { apiClient } from "../api/apiClient";
import { ApiResponse } from "../types/api";

export interface PeriodoVacacion {
  periodo: string;
  descripcion: string;
  diasDisponibles: number;
}

export interface DatosInicialesVacaciones {
  numeroEmpleado: number;
  nombreEmpleado: string;
  correoEmpleado: string;
  jefeInmediato: number;
  jefeInmediatoNombre: string;
  jefeInmediatoCorreo: string;
  periodoActual: PeriodoVacacion;
  periodosHistorial: PeriodoVacacion[];
  fechasRestringidas: string[];
}

export interface CalcularFechasRequest {
  compania: number;
  m103: number;
  fechaInicio: string;
  diasSolicitados: number;
  periodo: string;
}

export interface CalcularFechasResponse {
  fechaFin: string;
  fechaRetorno: string;
  tieneDiasAnticipados: string;
  diasAnticipados: number;
  periodoAnticipado: string;
  fechasAnticipadas: string;
  cruzaRestringidas: boolean;
  fechasRestringidasCruzadas: string;
  diasEfectivos?: string[];
  diasInhabiles?: string[];
}

export interface CrearSolicitud {
  compania: number;
  m103: number;
  nombreEmpleado?: string;
  periodo: string;
  correoEmpleado: string;
  fechaInicio: string;
  fechaFin: string;
  fechaRetorno: string;
  diasSolicitados: number;
  comentariosEmpleado: string;
  jefeInmediato: number;
  tieneRestriccion: string;
  fechasRestringidas: string;
  tieneDiasAnticipados: string;
  diasAnticipados: number;
  periodoAnticipado: string;
  fechasAnticipadas: string;
}

export interface SolicitudVacacion {
  compania: number;
  m103: number;
  numero: number;
  periodo: string;
  correoEmpleado: string;
  fechaRegistro: string;
  fechaInicio: string;
  fechaFin: string;
  fechaRetorno: string;
  diasSolicitados: number;
  comentariosEmpleado: string;
  estatus: string;
  cancelada: string;
  jefeInmediato: number;
}

export interface CancelarSolicitud {
  compania: number;
  m103: number;
  numero: number;
  comentarios: string;
}

export interface ActualizarSolicitud {
  compania: number;
  m103: number;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  fechaRetorno: string;
  diasSolicitados: number;
  comentariosEmpleado?: string;
  tieneRestriccion?: string;
  fechasRestringidas?: string;
  tieneDiasAnticipados?: string;
  diasAnticipados?: number;
  periodoAnticipado?: string;
  fechasAnticipadas?: string;
}

export const vacacionesService = {
  obtenerDatosIniciales: async (
    compania: number,
    m103: number,
  ): Promise<ApiResponse<DatosInicialesVacaciones>> => {
    const response = await apiClient.get<ApiResponse<DatosInicialesVacaciones>>(
      `/vacaciones/datos-iniciales/${compania}/${m103}`,
    );
    return response.data;
  },

  calcularFechas: async (
    payload: CalcularFechasRequest,
  ): Promise<ApiResponse<CalcularFechasResponse>> => {
    const response = await apiClient.post<ApiResponse<CalcularFechasResponse>>(
      `/vacaciones/calcular-fechas`,
      payload,
    );
    return response.data;
  },

  obtenerHistorial: async (
    compania: number,
    m103: number,
  ): Promise<ApiResponse<SolicitudVacacion[]>> => {
    const response = await apiClient.get<ApiResponse<SolicitudVacacion[]>>(
      `/vacaciones/historial/${compania}/${m103}`,
    );
    return response.data;
  },

  crearSolicitud: async (
    payload: CrearSolicitud,
  ): Promise<ApiResponse<number>> => {
    const response = await apiClient.post<ApiResponse<number>>(
      `/vacaciones/solicitar`,
      payload,
    );
    return response.data;
  },

  actualizarSolicitud: async (
    payload: ActualizarSolicitud,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/vacaciones/actualizar`,
      payload,
    );
    return response.data;
  },

  cancelarSolicitud: async (
    payload: CancelarSolicitud,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/vacaciones/cancelar`,
      { data: payload },
    );
    return response.data;
  },
};
