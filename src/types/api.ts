export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface VerificarRfcRequest {
  rfc: string;
  dispositivo: string;
}

export interface TurnoDetalleDto {
  diaIndice: number;
  diaNombre: string;
  esLaborable: boolean;
  entrada?: string;
  salida?: string;
  toleranciaEntradaMinutos?: number;
  salidaComida?: string;
  regresoComida?: string;
  toleranciaComidaMinutos?: number;
}

export interface HorarioDto {
  descripcion?: string;
  diasPatron?: string;
  secuenciaDias?: string;
  dias: TurnoDetalleDto[];
}

export interface EstadoEmpleadoDto {
  existe: boolean;
  tieneBiometria: boolean;
  mensaje?: string;
  rfc?: string;
  nombre?: string;
  numeroCompania?: number;
  razonSocial?: string;
  latitudEmpresa?: number;
  longitudEmpresa?: number;
  radioToleranciaMetros?: number;
  ultimoMovimientoHoy?: string;
  horario?: HorarioDto | TurnoDetalleDto[];
  trabajoRemoto?: string;
  numeroEmpleado?: number;
}

export interface HistoricoAMNDto {
  rfc: string;
  numeroCompania: number;
}

export interface HistoricoAMNResponse {
  numero: number;
  rfc: string;
  numeroCompania: number;
  fechaHora: string;
  latitud: number;
  longitud: number;
  dispositivoNombre: string;
  tipoMovimiento: string;
}

export type VerificarRfcResponse = EstadoEmpleadoDto;

export interface GenerarDesafioRequest {
  rfc: string;
  tipo: "ENROLAR" | "MARCAR";
}

export interface GenerarDesafioResponse {
  challenge: string;
  rfc: string;
}

export interface EnrolarBiometriaRequest {
  rfc: string;
  credentialId: string;
  publicKey: string;
  dispositivo: string;
  userAgent?: string;
}

export interface MarcarAsistenciaRequest {
  rfc: string;
  credentialId: string;
  latitud: number;
  longitud: number;
  dispositivo: string;
  tipoMovimiento:
    | "ENTRADA"
    | "SALIDA"
    | "RETARDO"
    | "SALIDA_COMIDA"
    | "ENTRADA_COMIDA";
}

export interface RegistroChecadaResponseDto {
  rfc: string;
  nombre: string;
  empresa: string;
  fechaHora: string;
  distanciaMetros: number;
  dentroDeRango: boolean;
  mensaje: string;
}

export interface SolicitudCreacionDto {
  rfc: string;
  numeroCompania: number;
  motivo: string;
}
