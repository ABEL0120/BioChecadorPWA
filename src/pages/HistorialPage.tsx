import React, { useEffect, useState, useMemo } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonBadge,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { useAuthSession } from "../context/AuthSessionContext";
import { checadorApi } from "../api/checadorApi";
import { HistoricoAMNResponse, TurnoDetalleDto } from "../types/api";
import {
  timeOutline,
  calendarOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  filterOutline,
} from "ionicons/icons";

interface DayData {
  fecha: Date;
  fechaStr: string;
  esLaborable: boolean;
  turno?: TurnoDetalleDto;
  registros: HistoricoAMNResponse[];
  estado:
    | "FALTA"
    | "A_TIEMPO"
    | "RETARDO"
    | "RETARDO_MAYOR"
    | "DESCANSO"
    | "INCOMPLETO";
  minutosRetardo: number;
}

const HistorialPage: React.FC = () => {
  const { user } = useAuthSession();
  const [historico, setHistorico] = useState<HistoricoAMNResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const formatDateToYMD = (d: Date) => {
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
      } catch (err: any) {
        setError(err.message || "Error de red al cargar historial");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [user]);

  const { horarioArray, secuenciaDias } = useMemo(() => {
    if (!user || !user.horario) return { horarioArray: [], secuenciaDias: "SAB" };
    let arr: any[] = [];
    let sec = "SAB";
    if (Array.isArray(user.horario)) {
      arr = user.horario;
    } else if (typeof user.horario === "object") {
      const h = user.horario as any;
      if (h.secuenciaDias) sec = h.secuenciaDias;

      if (h.dias && Array.isArray(h.dias)) {
        arr = h.dias;
      } else {
        const possibleArray = Object.values(user.horario).find((val) =>
          Array.isArray(val),
        );
        if (possibleArray) {
          arr = possibleArray as any[];
        } else {
          arr = [user.horario];
        }
      }
    }
    return { horarioArray: arr as TurnoDetalleDto[], secuenciaDias: sec.toUpperCase() };
  }, [user]);

  useEffect(() => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      if (start > end) {
        setError("La fecha inicial/final no puede ser mayor a la fecha final/inicial.");
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
    if (startNum > endNum || endNum - startNum > 31536000000) {
      return [];
    }

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
      const offsetMap: Record<string, number> = { "DOM": 0, "LUN": 1, "MAR": 2, "MIE": 3, "JUE": 4, "VIE": 5, "SAB": 6 };
      const offset = offsetMap[secuenciaDias] ?? 6;
      const diaBackend = (diaIndiceJS - offset + 7) % 7;
      const turno = horarioArray.find((h) => h.diaIndice === diaBackend);

      const esLaborable = turno?.esLaborable || false;

      const registrosDelDia = registrosEnRango.filter((r) => {
        const rDate = new Date(r.fechaHora);
        return formatDateToYMD(rDate) === fechaStr;
      });

      let estado: DayData["estado"] = "DESCANSO";
      let minutosRetardo = 0;

      if (esLaborable) {
        const entradaReg = registrosDelDia.find(
          (r) =>
            r.tipoMovimiento.toUpperCase() === "ENTRADA" ||
            r.tipoMovimiento.toUpperCase() === "RETARDO",
        );
        if (!entradaReg) {
          const ahora = new Date();
          if (fechaActual > ahora) {
            estado = "INCOMPLETO";
          } else {
            estado = "FALTA";
          }
        } else {
          if (turno && turno.entrada) {
            const [hE, mE] = turno.entrada.split(":").map(Number);
            const expectedTime = new Date(fechaActual);
            expectedTime.setHours(hE, mE, 0, 0);

            const realTime = new Date(entradaReg.fechaHora);
            minutosRetardo =
              (realTime.getTime() - expectedTime.getTime()) / 60000;
            const tol = turno.toleranciaEntradaMinutos || 0;

            if (minutosRetardo <= tol) {
              estado = "A_TIEMPO";
            } else if (minutosRetardo <= 30) {
              estado = "RETARDO";
            } else {
              estado = "RETARDO_MAYOR";
            }
          } else {
            estado = "A_TIEMPO";
          }
        }
      } else {
        if (registrosDelDia.length > 0) {
          estado = "A_TIEMPO";
        }
      }

      if (!(estado === "INCOMPLETO" && registrosDelDia.length === 0)) {
        if (!(estado === "DESCANSO" && registrosDelDia.length === 0)) {
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
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return daysList.reverse();
  }, [startDateStr, endDateStr, historico, horarioArray, user]);

  const getSemaforoUI = (estado: DayData["estado"]) => {
    switch (estado) {
      case "A_TIEMPO":
        return {
          text: "A Tiempo",
          icon: checkmarkCircleOutline,
          bg: "bg-green-50",
          border: "border-green-200",
          textCol: "text-green-700",
        };
      case "RETARDO":
        return {
          text: "Retardo",
          icon: alertCircleOutline,
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          textCol: "text-yellow-700",
        };
      case "RETARDO_MAYOR":
        return {
          text: "Retardo Mayor",
          icon: alertCircleOutline,
          bg: "bg-red-50",
          border: "border-red-200",
          textCol: "text-red-700",
        };
      case "FALTA":
        return {
          text: "Falta",
          icon: closeCircleOutline,
          bg: "bg-red-50",
          border: "border-red-200",
          textCol: "text-red-700",
        };
      case "DESCANSO":
        return {
          text: "Descanso Laborado",
          icon: checkmarkCircleOutline,
          bg: "bg-slate-100",
          border: "border-slate-200",
          textCol: "text-slate-700",
        };
      default:
        return null;
    }
  };

  const formatDelay = (minutos: number) => {
    if (minutos <= 0) return "Sin retardo";
    const hrs = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    if (hrs > 0) return `+${hrs}h ${mins}m`;
    return `+${mins}m`;
  };

  return (
    <IonPage id="historial-page" className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-2">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-900">
            Detalle Histórico
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-4xl mx-auto py-2">
          {!user ? (
            <div className="text-center text-slate-500 font-medium mt-10">
              No hay una sesión activa. Busca tu RFC en el panel principal
              primero.
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <IonIcon
                    icon={filterOutline}
                    className="text-slate-400 text-xl"
                  />
                  <span className="font-bold text-slate-700 text-sm">
                    Fechas:
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row flex-1 w-full gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-medium ml-1">
                      Inicio
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 font-medium ml-1">
                      Fin
                    </label>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-10">
                  <IonSpinner name="crescent" color="primary" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">
                  {error}
                </div>
              ) : diasDetallados.length === 0 ? (
                <div className="text-center text-slate-500 font-medium mt-10 bg-white p-8 rounded-3xl border border-slate-200">
                  <IonIcon
                    icon={calendarOutline}
                    className="text-slate-300 text-5xl mb-3 block mx-auto"
                  />
                  <p className="text-slate-700 font-bold">No hay registros</p>
                  <p className="text-slate-500 text-sm mt-1">
                    No tienes faltas ni asistencias en este rango de fechas.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {diasDetallados.map((dia, idx) => {
                    const ui = getSemaforoUI(dia.estado);
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                      >
                        <div className="bg-slate-50/50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <IonIcon
                              icon={calendarOutline}
                              className="text-slate-400 text-lg"
                            />
                            <span className="font-bold text-slate-700 capitalize">
                              {dia.fecha.toLocaleDateString("es-MX", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </span>
                          </div>
                          {ui && (
                            <div
                              className={`px-2 py-1 rounded-lg border ${ui.bg} ${ui.border} flex items-center gap-1`}
                            >
                              <IonIcon
                                icon={ui.icon}
                                className={`${ui.textCol} text-sm`}
                              />
                              <span
                                className={`${ui.textCol} text-[10px] font-black uppercase tracking-wide text-center whitespace-nowrap`}
                              >
                                {ui.text}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          {dia.estado === "FALTA" ? (
                            <div className="text-center py-5 bg-red-50/30 rounded-xl border border-red-100 border-dashed">
                              <p className="text-red-600 font-bold text-sm">
                                No se registró asistencia
                              </p>
                              {dia.turno?.entrada && (
                                <p className="text-red-400 font-medium text-xs mt-1">
                                  Tu entrada esperada era a las{" "}
                                  {dia.turno.entrada}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4">
                              {dia.turno?.entrada &&
                                dia.estado !== "DESCANSO" && (
                                  <div className="flex gap-3">
                                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">
                                        Esperada
                                      </p>
                                      <p className="font-black text-slate-700 flex items-center gap-1 text-sm">
                                        <IonIcon
                                          icon={timeOutline}
                                          className="text-slate-400"
                                        />
                                        {dia.turno.entrada}
                                      </p>
                                    </div>
                                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">
                                        Retraso
                                      </p>
                                      <p
                                        className={`font-black text-sm ${dia.minutosRetardo > 0 ? "text-red-600" : "text-green-600"}`}
                                      >
                                        {formatDelay(dia.minutosRetardo)}
                                      </p>
                                    </div>
                                  </div>
                                )}

                              <div className="space-y-2 mt-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1">
                                  Movimientos del día
                                </p>
                                {dia.registros.length === 0 ? (
                                  <p className="text-sm text-slate-500 italic ml-1">
                                    Sin movimientos registrados.
                                  </p>
                                ) : (
                                  dia.registros.map((reg, ridx) => (
                                    <div
                                      key={ridx}
                                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <IonBadge
                                          color={
                                            reg.tipoMovimiento.toUpperCase() ===
                                            "ENTRADA"
                                              ? "primary"
                                              : "secondary"
                                          }
                                          className="px-2 py-1 rounded-md text-[10px]"
                                        >
                                          {reg.tipoMovimiento}
                                        </IonBadge>
                                        <div className="font-bold text-slate-700 text-sm flex items-center gap-1">
                                          <IonIcon
                                            icon={timeOutline}
                                            className="text-slate-400"
                                          />
                                          {new Date(
                                            reg.fechaHora,
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </div>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium">
                                        {reg.dispositivoNombre || "N/D"}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HistorialPage;
