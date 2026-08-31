import { useState, useEffect } from "react";
import { EstadoEmpleadoDto, TurnoDetalleDto } from "../types/api";
import { GpsLocationResult } from "../services/locationService";
import { timeService } from "../services/timeService";

export interface ValidacionMarcajeResult {
  isValido: boolean;
  motivoBloqueo: string | null;
  mensajeAdvertencia: string | null;
  siguienteMovimiento: "ENTRADA" | "SALIDA" | "RETARDO" | "SALIDA_COMIDA" | "ENTRADA_COMIDA";
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

export const useValidacionMarcaje = (
  empleado: EstadoEmpleadoDto | null,
  userLocation: GpsLocationResult | null,
): ValidacionMarcajeResult => {
  const [result, setResult] = useState<ValidacionMarcajeResult>({
    isValido: false,
    motivoBloqueo: "Inicializando...",
    mensajeAdvertencia: null,
    siguienteMovimiento: "ENTRADA",
    distanciaMetros: null,
    toleranciaDeadline: null,
  });

  useEffect(() => {
    if (!empleado) {
      setResult({
        isValido: false,
        motivoBloqueo: "No hay empleado activo",
        mensajeAdvertencia: null,
        siguienteMovimiento: "ENTRADA",
        distanciaMetros: null,
        toleranciaDeadline: null,
      });
      return;
    }

    const validate = () => {
      try {
        let isDentroDeRango = true;
        let distancia = null;
        let mensajeAdvertenciaLocal = null;
        let motivoBloqueoLocal = null;

        if (
          userLocation &&
          empleado.latitudEmpresa != null &&
          empleado.longitudEmpresa != null &&
          empleado.radioToleranciaMetros != null
        ) {
          if (empleado.trabajoRemoto === "S") {
            isDentroDeRango = true;
            motivoBloqueoLocal = null;
            mensajeAdvertenciaLocal = "Home Office detectado: ubicación guardada.";
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
              motivoBloqueoLocal = `Fuera del área permitida (a ${Math.round(
                d,
              )}m, límite: ${empleado.radioToleranciaMetros}m).`;
              isDentroDeRango = false;
            }
          }
        }

        if (!isDentroDeRango) {
          setResult({
            isValido: false,
            motivoBloqueo: motivoBloqueoLocal,
            mensajeAdvertencia: mensajeAdvertenciaLocal,
            siguienteMovimiento: (empleado.ultimoMovimientoHoy === "ENTRADA" || empleado.ultimoMovimientoHoy === "RETARDO" || empleado.ultimoMovimientoHoy === "ENTRADA_COMIDA"
              ? "SALIDA"
              : "ENTRADA") as any,
            distanciaMetros: distancia !== null ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        let horarioArray: any[] = [];
        if (Array.isArray(empleado.horario)) {
          horarioArray = empleado.horario;
        } else if (empleado.horario && typeof empleado.horario === "object") {
          const possibleArray = Object.values(empleado.horario).find((val) =>
            Array.isArray(val),
          );
          if (possibleArray) {
            horarioArray = possibleArray as any[];
          } else {
            horarioArray = [empleado.horario];
          }
        }

        if (!horarioArray || horarioArray.length === 0) {
          let nextMovement: "ENTRADA" | "SALIDA" | "RETARDO" | "SALIDA_COMIDA" | "ENTRADA_COMIDA" =
            (empleado.ultimoMovimientoHoy === "ENTRADA" || empleado.ultimoMovimientoHoy === "RETARDO" || empleado.ultimoMovimientoHoy === "ENTRADA_COMIDA") ? "SALIDA" : "ENTRADA";
          setResult({
            isValido: true,
            motivoBloqueo: null,
            mensajeAdvertencia: null,
            siguienteMovimiento: nextMovement,
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        const normalizeStr = (str: string) =>
          (str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

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
            siguienteMovimiento: "ENTRADA",
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        }

        const now = timeService.now();
        let nextMovement: "ENTRADA" | "SALIDA" | "RETARDO" | "SALIDA_COMIDA" | "ENTRADA_COMIDA" = "ENTRADA";
        const ultimo = (empleado.ultimoMovimientoHoy || "").toUpperCase();

        if (!ultimo) {
          nextMovement = "ENTRADA";
        } else if (ultimo === "ENTRADA" || ultimo === "RETARDO") {
          if (turnoHoy.salidaComida && turnoHoy.regresoComida) {
            const salidaComidaTime = parseTimeToDate(turnoHoy.salidaComida);
            const regresoComidaTime = parseTimeToDate(turnoHoy.regresoComida);
            const toleranciaMin = turnoHoy.toleranciaComidaMinutos || 0;
            const limiteComidaTime = new Date(regresoComidaTime.getTime() + (toleranciaMin * 60000));

            // Permite SALIDA_COMIDA si estamos al menos a la hora de salida de comida, o un poco antes (opcional)
            if (now.getTime() >= (salidaComidaTime.getTime() - 600000) && now.getTime() <= limiteComidaTime.getTime()) {
              nextMovement = "SALIDA_COMIDA";
            } else {
              nextMovement = "SALIDA";
            }
          } else {
            nextMovement = "SALIDA";
          }
        } else if (ultimo === "SALIDA_COMIDA" || ultimo === "SALIDA_COMER") {
          nextMovement = "ENTRADA_COMIDA";
        } else if (ultimo === "ENTRADA_COMIDA" || ultimo === "ENTRADA_COMER") {
          nextMovement = "SALIDA";
        } else if (ultimo === "SALIDA") {
          setResult({
            isValido: false,
            motivoBloqueo: "Jornada terminada por hoy",
            mensajeAdvertencia: null,
            siguienteMovimiento: "ENTRADA",
            distanciaMetros: distancia ? Math.round(distancia) : null,
            toleranciaDeadline: null,
          });
          return;
        } else {
          nextMovement = "ENTRADA";
        }

        let motivoBloqueo = null;
        let mensajeAdvertencia = null;
        let isValido = true;
        let currentToleranciaDeadline: Date | null = null;

        try {
          if (nextMovement === "ENTRADA" && turnoHoy.entrada) {
            const entradaTime = parseTimeToDate(turnoHoy.entrada);
            const diffMinutes = (now.getTime() - entradaTime.getTime()) / 60000;
            const tolerancia = turnoHoy.toleranciaEntradaMinutos || 0;

            if (diffMinutes < -30) {
              isValido = false;
              motivoBloqueo = "Muy temprano (Permitido 30 min antes)";
            } else if (diffMinutes >= 0 && diffMinutes <= tolerancia && tolerancia > 0) {
              currentToleranciaDeadline = new Date(entradaTime.getTime() + tolerancia * 60000);
            } else if (diffMinutes > tolerancia) {
              const diffHours = Math.floor(diffMinutes / 60);
              const diffMinutesOnly = Math.floor(diffMinutes % 60);
              mensajeAdvertencia = `Retardo (${diffHours}h ${diffMinutesOnly}min)`;
              nextMovement = "RETARDO";
            }
          } else if (nextMovement === "SALIDA" && turnoHoy.salida) {
          }
        } catch (e) {
        }

        setResult({
          isValido,
          motivoBloqueo,
          mensajeAdvertencia,
          siguienteMovimiento: nextMovement,
          distanciaMetros: distancia ? Math.round(distancia) : null,
          toleranciaDeadline: currentToleranciaDeadline,
        });
      } catch (error) {
        setResult({
          isValido: false,
          motivoBloqueo: "Error calculando validación (Contacte soporte)",
          mensajeAdvertencia: null,
          siguienteMovimiento: "ENTRADA",
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
