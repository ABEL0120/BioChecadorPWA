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
} from "../types/api";

export const checadorApi = {
  verificarRfc: async (
    rfc: string,
  ): Promise<ApiResponse<VerificarRfcResponse>> => {
    const payload: VerificarRfcRequest = { rfc };
    const response = await apiClient.post<ApiResponse<VerificarRfcResponse>>(
      API_ENDPOINTS.CHECADOR.VERIFICAR_RFC,
      payload,
    );
    return response.data;
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
  ): Promise<ApiResponse<boolean>> => {
    const response = await apiClient.post<ApiResponse<boolean>>(
      API_ENDPOINTS.CHECADOR.MARCAR,
      payload,
    );
    return response.data;
  },
};
