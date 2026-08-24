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
  horario?: TurnoDetalleDto[];
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
  tipoMovimiento: "ENTRADA" | "SALIDA" | "RETARDO";
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
