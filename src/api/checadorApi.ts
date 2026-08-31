import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "./endpoints";
import {
  ApiResponse,
  VerificarRfcRequest,
  VerificarRfcResponse,
  GenerarDesafioRequest,
  GenerarDesafioResponse,
  EnrolarBiometriaRequest,
  MarcarAsistenciaRequest,
  RegistroChecadaResponseDto,
  HistoricoAMNResponse,
  SolicitudCreacionDto,
} from "../types/api";

export const checadorApi = {
  verificarRfc: async (
    rfc: string,
    dispositivo: string,
  ): Promise<ApiResponse<VerificarRfcResponse>> => {
    const payload = { rfc, dispositivo, dispositivoNombre: dispositivo };
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.CHECADOR.VERIFICAR_RFC,
      payload,
    );

    if (response.data && response.data.data) {
      const raw = response.data.data;
      response.data.data = {
        ...raw,
        existe: raw.existe ?? raw.Existe,
        tieneBiometria: raw.tieneBiometria ?? raw.TieneBiometria,
        mensaje: raw.mensaje ?? raw.Mensaje,
        rfc: raw.rfc ?? raw.Rfc,
        nombre: raw.nombre ?? raw.Nombre,
        numeroCompania: raw.numeroCompania ?? raw.NumeroCompania,
        razonSocial: raw.razonSocial ?? raw.RazonSocial,
        latitudEmpresa: raw.latitudEmpresa ?? raw.LatitudEmpresa,
        longitudEmpresa: raw.longitudEmpresa ?? raw.LongitudEmpresa,
        radioToleranciaMetros: raw.radioToleranciaMetros ?? raw.RadioToleranciaMetros,
        ultimoMovimientoHoy: raw.ultimoMovimientoHoy ?? raw.UltimoMovimientoHoy,
        trabajoRemoto: raw.trabajoRemoto ?? raw.TrabajoRemoto,
        numeroEmpleado: raw.numeroEmpleado ?? raw.NumeroEmpleado,
        horario: raw.horario ?? raw.Horario,
      };

      if (Array.isArray(response.data.data.horario)) {
        response.data.data.horario = response.data.data.horario.map(
          (h: any) => ({
            ...h,
            diaIndice: h.diaIndice ?? h.DiaIndice,
            diaNombre: h.diaNombre ?? h.DiaNombre,
            esLaborable: h.esLaborable ?? h.EsLaborable,
            entrada: h.entrada ?? h.Entrada,
            salida: h.salida ?? h.Salida,
            toleranciaEntradaMinutos:
              h.toleranciaEntradaMinutos ?? h.ToleranciaEntradaMinutos,
          }),
        );
      }
    }

    return response.data as ApiResponse<VerificarRfcResponse>;
  },

  generarDesafio: async (
    rfc: string,
    tipo: "ENROLAR" | "MARCAR",
  ): Promise<ApiResponse<GenerarDesafioResponse>> => {
    const payload: GenerarDesafioRequest = { rfc, tipo };
    const response = await apiClient.post<ApiResponse<GenerarDesafioResponse>>(
      API_ENDPOINTS.CHECADOR.GENERAR_DESAFIO,
      payload,
    );
    return response.data;
  },

  enrolar: async (
    payload: EnrolarBiometriaRequest,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      API_ENDPOINTS.CHECADOR.ENROLAR,
      payload,
    );
    return response.data;
  },

  marcar: async (
    payload: MarcarAsistenciaRequest,
  ): Promise<ApiResponse<RegistroChecadaResponseDto>> => {
    const response = await apiClient.post<
      ApiResponse<RegistroChecadaResponseDto>
    >(API_ENDPOINTS.CHECADOR.MARCAR, payload);
    return response.data;
  },

  consultarHistorico: async (
    rfc: string,
    numeroCompania: number,
  ): Promise<ApiResponse<HistoricoAMNResponse[]>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.CHECADOR.HISTORICO,
      {
        rfc,
        numeroCompania,
      },
    );

    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      response.data.data = response.data.data.map((raw: any) => ({
        ...raw,
        numero: raw.numero ?? raw.Numero,
        rfc: raw.rfc ?? raw.Rfc,
        numeroCompania: raw.numeroCompania ?? raw.NumeroCompania,
        fechaHora: raw.fechaHora ?? raw.FechaHora,
        latitud: raw.latitud ?? raw.Latitud,
        longitud: raw.longitud ?? raw.Longitud,
        dispositivoNombre: raw.dispositivoNombre ?? raw.DispositivoNombre,
        tipoMovimiento: raw.tipoMovimiento ?? raw.TipoMovimiento,
      }));
    }

    return response.data as ApiResponse<HistoricoAMNResponse[]>;
  },

  enviarSolicitud: async (
    payload: SolicitudCreacionDto,
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      API_ENDPOINTS.CHECADOR.SOLICITUD,
      payload,
    );
    return response.data;
  },

  consultarEstatusSolicitud: async (
    rfc: string,
    numeroCompania: number,
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        API_ENDPOINTS.CHECADOR.ESTATUS_SOLICITUD,
        { rfc, numeroCompania, motivo: "consulta", tipoDispositivo: "consulta" },
      );
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data) {
        return err.response.data;
      }
      throw err;
    }
  },
};
