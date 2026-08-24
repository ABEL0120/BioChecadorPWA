import { useState, useEffect } from "react";
import { EstadoEmpleadoDto, TurnoDetalleDto } from "../types/api";
import { GpsLocationResult } from "../services/locationService";

export interface ValidacionMarcajeResult {
  isValido: boolean;
  motivoBloqueo: string | null;
  mensajeAdvertencia: string | null;
  siguienteMovimiento: "ENTRADA" | "SALIDA" | "RETARDO";
  distanciaMetros: number | null;
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
  const d = new Date();
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
  });

  useEffect(() => {
    if (!empleado) {
      setResult({
        isValido: false,
        motivoBloqueo: "No hay empleado activo",
        mensajeAdvertencia: null,
        siguienteMovimiento: "ENTRADA",
        distanciaMetros: null,
      });
      return;
    }

    const validate = () => {
      try {
        let isDentroDeRango = true;
        let distancia = null;
        if (
          userLocation &&
          empleado.latitudEmpresa != null &&
          empleado.longitudEmpresa != null &&
          empleado.radioToleranciaMetros != null
        ) {
          distancia = calcularDistanciaHaversine(
            userLocation.latitud,
            userLocation.longitud,
            empleado.latitudEmpresa,
            empleado.longitudEmpresa,
          );
          isDentroDeRango =
            distancia <= (empleado.radioToleranciaMetros || 150);
        }

        if (!isDentroDeRango && distancia !== null) {
          setResult({
            isValido: false,
            motivoBloqueo: `Fuera de sucursal por ${Math.round(distancia - (empleado.radioToleranciaMetros || 150))}m`,
            mensajeAdvertencia: null,
            siguienteMovimiento: (empleado.ultimoMovimientoHoy === "ENTRADA"
              ? "SALIDA"
              : "ENTRADA") as any,
            distanciaMetros: Math.round(distancia),
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
          let nextMovement: "ENTRADA" | "SALIDA" | "RETARDO" =
            empleado.ultimoMovimientoHoy === "ENTRADA" ? "SALIDA" : "ENTRADA";
          setResult({
            isValido: true,
            motivoBloqueo: null,
            mensajeAdvertencia: null,
            siguienteMovimiento: nextMovement,
            distanciaMetros: distancia ? Math.round(distancia) : null,
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
        const nombreHoyJS = diasSemanaJS[new Date().getDay()];

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
          });
          return;
        }

        let nextMovement: "ENTRADA" | "SALIDA" | "RETARDO" = "ENTRADA";
        const ultimo = empleado.ultimoMovimientoHoy;

        if (!ultimo) {
          nextMovement = "ENTRADA";
        } else if (ultimo === "ENTRADA" || ultimo === "RETARDO") {
          nextMovement = "SALIDA";
        } else if (ultimo === "SALIDA") {
          setResult({
            isValido: false,
            motivoBloqueo: "Jornada terminada por hoy",
            mensajeAdvertencia: null,
            siguienteMovimiento: "ENTRADA",
            distanciaMetros: distancia ? Math.round(distancia) : null,
          });
          return;
        } else {
          nextMovement = "ENTRADA";
        }

        const now = new Date();
        let motivoBloqueo = null;
        let mensajeAdvertencia = null;
        let isValido = true;

        try {
          if (nextMovement === "ENTRADA" && turnoHoy.entrada) {
            const entradaTime = parseTimeToDate(turnoHoy.entrada);
            const diffMinutes = (now.getTime() - entradaTime.getTime()) / 60000;
            const tolerancia = turnoHoy.toleranciaEntradaMinutos || 0;

            if (diffMinutes < -30) {
              isValido = false;
              motivoBloqueo = "Muy temprano (Permitido 30 min antes)";
            } else if (diffMinutes > tolerancia) {
              const diffHours = Math.floor(diffMinutes / 60);
              const diffMinutesOnly = Math.floor(diffMinutes % 60);
              mensajeAdvertencia = `Retardo (${diffHours}h ${diffMinutesOnly}min)`;
              nextMovement = "RETARDO";
            }
          } else if (nextMovement === "SALIDA" && turnoHoy.salida) {
          }
        } catch (e) {
          console.error("Error parseando horario", e);
        }

        setResult({
          isValido,
          motivoBloqueo,
          mensajeAdvertencia,
          siguienteMovimiento: nextMovement,
          distanciaMetros: distancia ? Math.round(distancia) : null,
        });
      } catch (error) {
        console.error("Crash prevented in validation hook", error);
        setResult({
          isValido: false,
          motivoBloqueo: "Error calculando validación (Contacte soporte)",
          mensajeAdvertencia: null,
          siguienteMovimiento: "ENTRADA",
          distanciaMetros: null,
        });
      }
    };

    validate();
    const interval = setInterval(validate, 60000);
    return () => clearInterval(interval);
  }, [empleado, userLocation]);

  return result;
};
