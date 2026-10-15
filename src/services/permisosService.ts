import { apiClient } from "../api/apiClient";
import { ApiResponse } from "../types/api";

export interface PermisoEmpleado {
  compania: number;
  numero: number;
  m103: number;
  secuenciaM103: number;
  nombreEmpleado: string;
  fechaInicioPermiso: string;
  fechaFinalizaPermiso: string;
  horaIniciaPermiso: string;
  horaFinalizaPermiso: string;
  minutosTotalPermiso: number;
  tiempoTexto: string;
  motivoPermiso: string;
  fechaRegistro: string;
  horaRegistro: string;
  voBo: string;
  personalVoBo: number;
  personalNombreVoBo: string;
  aplicaVacaciones: string;
  solicitudVacaciones: number;
}

export interface DatosInicialesPermisos {
  numeroEmpleado: number;
  nombreEmpleado: string;
  correoEmpleado: string;
  jefeInmediato: number;
  jefeInmediatoNombre: string;
  jefeInmediatoCorreo: string;
  diasVacacionesDisponibles: number;
  periodoVacacionesActual?: string;
  turnoDescripcion: string;
  horarioHoy: string;
  comidaHoy: string;
}

export interface CalcularTiempoRequest {
  compania: number;
  m103: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
}

export interface CalcularTiempoResponse {
  minutosBrutos: number;
  minutosComidaDescontados: number;
  minutosNetos: number;
  tiempoTexto: string;
  permiteVacaciones: boolean;
  diasLaborablesVacaciones: number;
  cruzaComida: boolean;
  mensajeDetalle: string;
  esValido: boolean;
  errorValidacion: string;
}

export interface CrearPermiso {
  compania: number;
  m103: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  aplicaVacaciones?: string;
}

export interface ActualizarPermiso {
  compania: number;
  m103: number;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  aplicaVacaciones: string;
}

export interface CancelarPermiso {
  compania: number;
  m103: number;
  numero: number;
}

export const permisosService = {
  obtenerDatosIniciales: async (
    compania: number,
    m103: number,
  ): Promise<ApiResponse<DatosInicialesPermisos>> => {
    const response = await apiClient.get<ApiResponse<DatosInicialesPermisos>>(
      `/permisos/datos-iniciales/${compania}/${m103}`,
    );
    return response.data;
  },

  calcularTiempo: async (
    payload: CalcularTiempoRequest,
  ): Promise<ApiResponse<CalcularTiempoResponse>> => {
    const response = await apiClient.post<ApiResponse<CalcularTiempoResponse>>(
      `/permisos/calcular-tiempo`,
      payload,
    );
    return response.data;
  },

  obtenerHistorial: async (
    compania: number,
    m103: number,
  ): Promise<ApiResponse<PermisoEmpleado[]>> => {
    const response = await apiClient.get<ApiResponse<PermisoEmpleado[]>>(
      `/permisos/historial/${compania}/${m103}`,
    );
    return response.data;
  },

  crearPermiso: async (payload: CrearPermiso): Promise<ApiResponse<number>> => {
    const response = await apiClient.post<ApiResponse<number>>(
      `/permisos/solicitar`,
      payload,
    );
    return response.data;
  },

  actualizarPermiso: async (
    payload: ActualizarPermiso,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/permisos/actualizar`,
      payload,
    );
    return response.data;
  },

  cancelarPermiso: async (
    payload: CancelarPermiso,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/permisos/cancelar`,
      { data: payload },
    );
    return response.data;
  },
};
