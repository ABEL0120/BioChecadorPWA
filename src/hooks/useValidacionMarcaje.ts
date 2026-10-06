import { useState, useEffect } from "react";
import { EstadoEmpleadoDto, TurnoDetalleDto } from "../types/api";
import { GpsLocationResult } from "../services/locationService";
import { timeService } from "../services/timeService";

export type MovimientoPermitido = 
  | "ENTRADA"
  | "SALIDA"
  | "RETARDO"
  | "SALIDA_COMIDA"
  | "ENTRADA_COMIDA";

export interface ValidacionMarcajeResult {
  isValido: boolean;
  motivoBloqueo: string | null;
  mensajeAdvertencia: string | null;
  siguienteMovimiento: MovimientoPermitido[];
  distanciaMetros: number | null;
  toleranciaDeadline: Date | null;
}

export const calcularDistanciaHaversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const parseTimeToDate = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = timeService.now();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const getHorarioArray = (empleado: EstadoEmpleadoDto): TurnoDetalleDto[] => {
  if (Array.isArray(empleado.horario)) {
    return empleado.horario as TurnoDetalleDto[];
  }
  if (empleado.horario && typeof empleado.horario === "object") {
    const possibleArray = Object.values(empleado.horario).find((val) =>
      Array.isArray(val)
    );
    if (possibleArray) {
      return possibleArray as TurnoDetalleDto[];
    }
    return [empleado.horario as unknown as TurnoDetalleDto];
  }
  return [];
};

const normalizeStr = (str: string) =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const useValidacionMarcaje = (
  empleado: EstadoEmpleadoDto | null,
  userLocation: GpsLocationResult | null,
): ValidacionMarcajeResult => {
  const [result, setResult] = useState<ValidacionMarcajeResult>({
    isValido: false,
    motivoBloqueo: "Inicializando...",
    mensajeAdvertencia: null,
    siguienteMovimiento: ["ENTRADA"],
    distanciaMetros: null,
    toleranciaDeadline: null,
  });

  useEffect(() => {
    if (!empleado) {
      setResult({
        isValido: false,
        motivoBloqueo: "No hay empleado activo",
        mensajeAdvertencia: null,
        siguienteMovimiento: ["ENTRADA"],
        distanciaMetros: null,
        toleranciaDeadline: null,
      });
      return;
    }

    const validate = () => {
      try {
        let isDentroDeRango = true;
        let distancia: number | null = null;
        const motivoBloqueoLocal: string | null = null;

        if (
          userLocation &&
          empleado.latitudEmpresa != null &&
          empleado.longitudEmpresa != null &&
          empleado.radioToleranciaMetros != null
        ) {
          const esRemoto = true;

          if (esRemoto) {
            isDentroDeRango = true;
          } else {
            const d = calcularDistanciaHaversine(
              userLocation.latitud,
              userLocation.longitud,
              empleado.latitudEmpresa,
              empleado.longitudEmpresa,
            );
            distancia = d;

            const umbralGps = 15;
            const radioEfectivo = empleado.radioToleranciaMetros + umbralGps;

            if (d <= radioEfectivo) {
              isDentroDeRango = true;
            } else {
              isDentroDeRango = false;
            }
          }
        }

        const ultimo = (empleado.ultimoMovimientoHoy || "").toUpperCase();
        let fallbackMovements: MovimientoPermitido[] = ["ENTRADA"];
        if (!ultimo) {
          fallbackMovements = ["ENTRADA"];
        } else if (ultimo === "ENTRADA" || ultimo === "RETARDO") {
          fallbackMovements = ["SALIDA_COMIDA", "SALIDA"];
        } else if (ultimo === "SALIDA_COMIDA" || ultimo === "SALIDA_COMER") {
          fallbackMovements = ["ENTRADA_COMIDA"];
        } else if (ultimo === "ENTRADA_COMIDA" || ultimo === "ENTRADA_COMER") {
          fallbackMovements = ["SALIDA"];
        } else if (ultimo === "SALIDA") {
          fallbackMovements = ["ENTRADA"];
        }

        if (!isDentroDeRango) {
          setResult({
            isValido: false,
            motivoBloqueo: distancia ? `Fuera del área permitida (a ${Math.round(distancia)}m, límite: ${empleado.radioToleranciaMetros}m).` : "Fuera del área permitida",
            mensajeAdvertencia: null,
            siguienteMovimiento: fallbackMovements,
            distanciaMetros: distancia !== null ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        const horarioArray = getHorarioArray(empleado);

        if (!horarioArray || horarioArray.length === 0) {
          setResult({
            isValido: true,
            motivoBloqueo: null,
            mensajeAdvertencia: null,
            siguienteMovimiento: fallbackMovements,
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        const diasSemanaJS = [
          "domingo",
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
        ];
        const nombreHoyJS = diasSemanaJS[timeService.now().getDay()];

        let turnoHoy = horarioArray.find(
          (h) => normalizeStr(h.diaNombre) === nombreHoyJS,
        );

        if (
          !turnoHoy &&
          horarioArray.length === 1 &&
          typeof horarioArray[0].diaIndice !== "number"
        ) {
          turnoHoy = horarioArray[0];
        }

        if (!turnoHoy || !turnoHoy.esLaborable) {
          setResult({
            isValido: false,
            motivoBloqueo: "Día de descanso",
            mensajeAdvertencia: null,
            siguienteMovimiento: fallbackMovements,
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        const now = timeService.now();
        let nextMovements: MovimientoPermitido[] = fallbackMovements;

        if (ultimo === "SALIDA") {
          setResult({
            isValido: false,
            motivoBloqueo: "Jornada terminada por hoy",
            mensajeAdvertencia: null,
            siguienteMovimiento: ["ENTRADA"],
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        let isValido = true;
        let motivoBloqueoFinal: string | null = null;
        let mensajeAdvertenciaFinal: string | null = null;
        let currentToleranciaDeadline: Date | null = null;

        if (nextMovements[0] === "ENTRADA" && turnoHoy.entrada && nextMovements.length === 1) {
          const entradaTime = parseTimeToDate(turnoHoy.entrada);
          const diffMinutes = (now.getTime() - entradaTime.getTime()) / 60000;
          const tolerancia = turnoHoy.toleranciaEntradaMinutos || 0;

          let blockEntrada = false;
          if (turnoHoy.salida) {
            const salidaTime = parseTimeToDate(turnoHoy.salida);
            if (now.getTime() > salidaTime.getTime()) {
              isValido = false;
              motivoBloqueoFinal = "Jornada laboral finalizada. No puedes registrar entrada.";
              blockEntrada = true;
            }
          }

          if (!blockEntrada) {
            if (diffMinutes < -30) {
              isValido = false;
              motivoBloqueoFinal = "Muy temprano (Permitido 30 min antes)";
            } else if (
              diffMinutes >= 0 &&
              diffMinutes <= tolerancia &&
              tolerancia > 0
            ) {
              currentToleranciaDeadline = new Date(
                entradaTime.getTime() + tolerancia * 60000,
              );
            } else if (diffMinutes > tolerancia) {
              const diffHours = Math.floor(diffMinutes / 60);
              const diffMinutesOnly = Math.floor(diffMinutes % 60);
              mensajeAdvertenciaFinal = `Retardo (${diffHours}h ${diffMinutesOnly}min)`;
              nextMovements = ["RETARDO"];
            }
          }
        }

        setResult({
          isValido,
          motivoBloqueo: motivoBloqueoFinal,
          mensajeAdvertencia: mensajeAdvertenciaFinal,
          siguienteMovimiento: nextMovements,
          distanciaMetros: distancia ? Math.round(distancia) : null,
          toleranciaDeadline: currentToleranciaDeadline,
        });
      } catch (error) {
        setResult({
          isValido: false,
          motivoBloqueo: "Error calculando validación (Contacte soporte)",
          mensajeAdvertencia: null,
          siguienteMovimiento: ["ENTRADA"],
          distanciaMetros: null,
          toleranciaDeadline: null,
        });
      }
    };

    validate();
    const interval = setInterval(validate, 10000);
    return () => clearInterval(interval);
  }, [empleado, userLocation]);

  return result;
};
