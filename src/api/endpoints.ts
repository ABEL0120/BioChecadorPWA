export const API_ENDPOINTS = {
  CHECADOR: {
    VERIFICAR_RFC: "/checador/verificar-rfc",
    GENERAR_DESAFIO: "/checador/generar-desafio",
    ENROLAR: "/checador/enrolar",
    MARCAR: "/checador/marcar",
    HISTORICO: "/checador/historico",
  },
  AUTH: {
    LOGIN: "/auth/login",
    REGISTRO: "/auth/registro",
  },
} as const;
