import { useState, useEffect, useMemo } from "react";
import { useAuthSession } from "../context/AuthSessionContext";
import { checadorApi } from "../api/checadorApi";
import { timeService } from "../services/timeService";
import { HistoricoAMNResponse, TurnoDetalleDto } from "../types/api";
import { DayData } from "../components/DiaHistorialItem";

export const useHistorial = () => {
  const { user } = useAuthSession();
  const [historico, setHistorico] = useState<HistoricoAMNResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const formatDateToYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [startDateStr, setStartDateStr] = useState<string>(
    formatDateToYMD(inicioMes),
  );
  const [endDateStr, setEndDateStr] = useState<string>(formatDateToYMD(hoy));

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await checadorApi.consultarHistorico(
          user.rfc || "",
          user.numeroCompania || 0,
        );
        if (res.success && res.data) {
          setHistorico(res.data);
        } else {
          setError(res.message || "Error al cargar historial");
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Error de red al cargar historial",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [user]);

  const { horarioArray, secuenciaDias } = useMemo(() => {
    if (!user || !user.horario)
      return { horarioArray: [] as TurnoDetalleDto[], secuenciaDias: "SAB" };
    let arr: TurnoDetalleDto[] = [];
    let sec = "SAB";

    if (Array.isArray(user.horario)) {
      arr = user.horario as TurnoDetalleDto[];
    } else if (typeof user.horario === "object" && user.horario !== null) {
      // Avoid explicit 'any' by using Record
      const h = user.horario as unknown as Record<string, unknown>;
      if (typeof h.secuenciaDias === "string") sec = h.secuenciaDias;
      if (Array.isArray(h.dias)) {
        arr = h.dias as TurnoDetalleDto[];
      } else {
        const possibleArray = Object.values(user.horario).find((val) =>
          Array.isArray(val),
        );
        arr = possibleArray
          ? (possibleArray as TurnoDetalleDto[])
          : ([user.horario] as unknown as TurnoDetalleDto[]);
      }
    }
    return {
      horarioArray: arr,
      secuenciaDias: sec.toUpperCase(),
    };
  }, [user]);

  useEffect(() => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      if (start > end) {
        setError("La fecha de inicio no puede ser mayor a la final.");
      } else if (end - start > 31536000000) {
        setError("No puedes filtrar más de un año.");
      } else {
        setError(null);
      }
    }
  }, [startDateStr, endDateStr]);

  const diasDetallados = useMemo(() => {
    if (!startDateStr || !endDateStr || !user) return [];

    const startNum = new Date(startDateStr).getTime();
    const endNum = new Date(endDateStr).getTime();
    if (startNum > endNum || endNum - startNum > 31536000000) return [];

    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(endDateStr + "T23:59:59");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end)
      return [];

    const daysList: DayData[] = [];
    const currentDate = new Date(start);
    const registrosEnRango = historico.filter((r) => {
      const d = new Date(r.fechaHora);
      return d >= start && d <= end;
    });

    while (currentDate <= end) {
      const fechaActual = new Date(currentDate);
      const fechaStr = formatDateToYMD(fechaActual);
      const diaIndiceJS = fechaActual.getDay();
      const offsetMap: Record<string, number> = {
        DOM: 0,
        LUN: 1,
        MAR: 2,
        MIE: 3,
        JUE: 4,
        VIE: 5,
        SAB: 6,
      };
      const offset = offsetMap[secuenciaDias] ?? 6;
      const diaBackend = (diaIndiceJS - offset + 7) % 7;
      const turno = horarioArray.find((h) => h.diaIndice === diaBackend);
      const esLaborable = turno?.esLaborable || false;

      const registrosDelDia = registrosEnRango.filter(
        (r) => formatDateToYMD(new Date(r.fechaHora)) === fechaStr,
      );
      let estado: DayData["estado"] = "DESCANSO";
      let minutosRetardo = 0;

      if (esLaborable) {
        const entradaReg = registrosDelDia.find(
          (r) =>
            r.tipoMovimiento.toUpperCase() === "ENTRADA" ||
            r.tipoMovimiento.toUpperCase() === "RETARDO",
        );
        if (!entradaReg) {
          const ahora = timeService.now();
          if (fechaStr === formatDateToYMD(ahora) || fechaActual > ahora)
            estado = "INCOMPLETO";
          else estado = "FALTA";
        } else {
          if (turno && turno.entrada) {
            const [hE, mE] = turno.entrada.split(":").map(Number);
            const expectedTime = new Date(fechaActual);
            expectedTime.setHours(hE, mE, 0, 0);
            const realTime = new Date(entradaReg.fechaHora);
            minutosRetardo =
              (realTime.getTime() - expectedTime.getTime()) / 60000;
            const tol = turno.toleranciaEntradaMinutos || 0;
            if (minutosRetardo <= tol) estado = "A_TIEMPO";
            else if (minutosRetardo <= 30) estado = "RETARDO";
            else estado = "RETARDO_MAYOR";
          } else {
            estado = "A_TIEMPO";
          }
        }
      } else {
        if (registrosDelDia.length > 0) estado = "A_TIEMPO";
      }

      if (
        !(estado === "INCOMPLETO" && registrosDelDia.length === 0) &&
        !(estado === "DESCANSO" && registrosDelDia.length === 0)
      ) {
        daysList.push({
          fecha: fechaActual,
          fechaStr,
          esLaborable,
          turno,
          registros: registrosDelDia,
          estado,
          minutosRetardo,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return daysList.reverse();
  }, [startDateStr, endDateStr, historico, horarioArray, user, secuenciaDias]);

  return {
    user,
    loading,
    error,
    startDateStr,
    setStartDateStr,
    endDateStr,
    setEndDateStr,
    diasDetallados,
  };
};
