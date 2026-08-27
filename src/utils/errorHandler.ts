import { AxiosError } from "axios";

export const formatError = (error: any, defaultMessage: string = "Ha ocurrido un error inesperado."): string => {
  if (!error) return defaultMessage;

  if (error.isAxiosError) {
    const axiosError = error as AxiosError<any>;
    if (!axiosError.response) {
      return "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
    }

    const apiMessage = axiosError.response.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      const msgLower = apiMessage.toLowerCase();
      if (!msgLower.includes("sql") && !msgLower.includes("line ") && !msgLower.includes("c:\\")) {
        return apiMessage;
      }
    }

    const status = axiosError.response.status;
    switch (status) {
      case 400:
        return "La solicitud es incorrecta o faltan datos.";
      case 401:
        return "No tienes autorización para realizar esta acción.";
      case 403:
        return "Acceso denegado.";
      case 404:
        return "El recurso solicitado no fue encontrado.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "El servicio no está disponible temporalmente. Intenta más tarde.";
      default:
        return "Ocurrió un error al procesar la solicitud en el servidor.";
    }
  }

  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "Permiso denegado por el usuario (ej. cámara, ubicación o biometría).";
      case "SecurityError":
        return "Operación bloqueada por seguridad del navegador.";
      case "NotSupportedError":
        return "Tu dispositivo o navegador no soporta esta función.";
      case "TimeoutError":
        return "La operación tardó demasiado y fue cancelada.";
      default:
        return "Error interno del sistema o navegador.";
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("sql") || msg.includes("c:\\") || msg.includes("line") || msg.includes("syntax")) {
      return "Error interno en el sistema. Contacta a soporte.";
    }
    
    if (msg.includes("credencial") || msg.includes("huella") || msg.includes("rostro") || msg.includes("gps") || msg.includes("ubicación") || msg.includes("cancel")) {
       return error.message; 
    }
  }

  return defaultMessage;
};
