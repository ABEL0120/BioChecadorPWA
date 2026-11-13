import { EstadoEmpleadoDto } from "../types/api";
import { timeService } from "../services/timeService";

export const esMismoDiaLocal = (fecha?: string | null): boolean => {
  if (!fecha) return false;
  return fecha.slice(0, 10) === timeService.nowDateLocal();
};

export const normalizarSesionPorDia = (
  empleado: EstadoEmpleadoDto,
): { empleadoNormalizado: EstadoEmpleadoDto; cambioDeDia: boolean } => {
  const hoyLocal = timeService.nowDateLocal();
  const fechaGuardada = empleado.fechaGuardadoLocal;

  if (fechaGuardada && fechaGuardada !== hoyLocal) {
    return {
      empleadoNormalizado: {
        ...empleado,
        ultimoMovimientoHoy: "",
        tieneSalidaHoy: false,
        fechaGuardadoLocal: hoyLocal,
      },
      cambioDeDia: true,
    };
  }

  if (!fechaGuardada) {
    return {
      empleadoNormalizado: {
        ...empleado,
        fechaGuardadoLocal: hoyLocal,
      },
      cambioDeDia: false,
    };
  }

  return {
    empleadoNormalizado: empleado,
    cambioDeDia: false,
  };
};

export const obtenerEstadoMovimientosHoy = (
  empleado?: EstadoEmpleadoDto | null,
): { ultimoMovimientoHoy: string; tieneSalidaHoy: boolean } => {
  if (!empleado) {
    return { ultimoMovimientoHoy: "", tieneSalidaHoy: false };
  }

  const hoyLocal = timeService.nowDateLocal();
  if (
    empleado.fechaGuardadoLocal &&
    empleado.fechaGuardadoLocal !== hoyLocal
  ) {
    return { ultimoMovimientoHoy: "", tieneSalidaHoy: false };
  }

  const ultimoMovimientoHoy = (empleado.ultimoMovimientoHoy || "")
    .trim()
    .toUpperCase();
  const tieneSalidaHoy = Boolean(
    empleado.tieneSalidaHoy ||
      ultimoMovimientoHoy === "SALIDA" ||
      ultimoMovimientoHoy.includes("SALIDA"),
  );

  return { ultimoMovimientoHoy, tieneSalidaHoy };
};

