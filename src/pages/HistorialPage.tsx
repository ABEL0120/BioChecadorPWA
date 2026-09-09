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
import { timeService } from "../services/timeService";
import { HistoricoAMNResponse, TurnoDetalleDto } from "../types/api";
import {
  timeOutline,
  calendarOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  filterOutline,
  chevronDownOutline,
  chevronUpOutline,
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

const DiaHistorialItem: React.FC<{ dia: DayData; getSemaforoUI: any; formatDelay: any }> = ({ dia, getSemaforoUI, formatDelay }) => {
  const [expanded, setExpanded] = useState(false);
  const ui = getSemaforoUI(dia.estado);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full box-border transition-all duration-300 floating-card mb-4">
      <div 
        className="bg-slate-50/80 backdrop-blur-sm px-4 sm:px-5 py-4 flex justify-between items-center w-full box-border cursor-pointer hover:bg-slate-100/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
            <IonIcon icon={calendarOutline} className="text-blue-500 text-sm" />
          </div>
          <span className="font-black text-slate-800 text-[13px] sm:text-[15px] capitalize truncate tracking-wide">
            {dia.fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {ui && (
            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 flex-shrink-0 shadow-sm ${ui.bg} ${ui.border}`}>
              <IonIcon icon={ui.icon} className={`${ui.textCol} text-sm`} />
              <span className={`${ui.textCol} text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}>
                {ui.text}
              </span>
            </div>
          )}
          <IonIcon 
            icon={expanded ? chevronUpOutline : chevronDownOutline} 
            className="text-slate-400 text-lg transition-transform duration-300"
          />
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 sm:p-5 w-full box-border border-t border-slate-100">
          {dia.estado === "FALTA" ? (
            <div className="text-center py-5 bg-red-50/50 rounded-2xl border border-red-100 w-full box-border">
              <p className="text-red-600 font-black tracking-wide text-xs sm:text-sm">
                No se registró asistencia
              </p>
              {dia.turno?.entrada && (
                <p className="text-red-400 font-bold text-[10px] sm:text-xs mt-1.5">
                  Tu entrada esperada era a las {dia.turno.entrada}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full box-border">
              {dia.turno?.entrada && dia.estado !== "DESCANSO" && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-100 flex flex-col justify-center min-w-0">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 truncate">
                      Hora Esperada
                    </p>
                    <p className="font-mono font-black text-slate-700 flex items-center gap-1.5 text-sm sm:text-base truncate">
                      <IonIcon icon={timeOutline} className="text-slate-400 flex-shrink-0" />
                      {dia.turno.entrada}
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-100 flex flex-col justify-center min-w-0">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 truncate">
                      Desviación
                    </p>
                    <p className={`font-mono font-black text-sm sm:text-base truncate ${dia.minutosRetardo > 0 ? "text-red-500" : "text-emerald-500"}`}>
                      {formatDelay(dia.minutosRetardo)}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3 mt-1 w-full box-border">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Movimientos del día
                </p>
                {dia.registros.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400 italic ml-1">
                    Sin movimientos registrados.
                  </p>
                ) : (
                  dia.registros.map((reg, ridx) => (
                    <div key={ridx} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-slate-100 bg-white shadow-sm w-full box-border gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <IonBadge
                          color="primary"
                          className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] flex-shrink-0 font-bold tracking-wide shadow-sm"
                        >
                          {reg.tipoMovimiento
                            ? reg.tipoMovimiento
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (char) => char.toUpperCase())
                            : ""}
                        </IonBadge>
                        <div className="font-mono font-black text-slate-700 text-[13px] sm:text-[15px] flex items-center gap-1.5 truncate">
                          <IonIcon icon={timeOutline} className="text-slate-400 flex-shrink-0" />
                          {new Date(reg.fechaHora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 truncate max-w-[40%] text-right bg-slate-50 px-2 py-1 rounded-md">
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
    </div>
  );
};

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

  const [startDateStr, setStartDateStr] = useState<string>(formatDateToYMD(inicioMes));
  const [endDateStr, setEndDateStr] = useState<string>(formatDateToYMD(hoy));

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await checadorApi.consultarHistorico(user.rfc || "", user.numeroCompania || 0);
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
      if (h.dias && Array.isArray(h.dias)) arr = h.dias;
      else {
        const possibleArray = Object.values(user.horario).find(val => Array.isArray(val));
        arr = possibleArray ? (possibleArray as any[]) : [user.horario];
      }
    }
    return { horarioArray: arr as TurnoDetalleDto[], secuenciaDias: sec.toUpperCase() };
  }, [user]);

  useEffect(() => {
    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr).getTime();
      const end = new Date(endDateStr).getTime();
      if (start > end) setError("La fecha de inicio no puede ser mayor a la final.");
      else if (end - start > 31536000000) setError("No puedes filtrar más de un año.");
      else setError(null);
    }
  }, [startDateStr, endDateStr]);

  const diasDetallados = useMemo(() => {
    if (!startDateStr || !endDateStr || !user) return [];
    
    const startNum = new Date(startDateStr).getTime();
    const endNum = new Date(endDateStr).getTime();
    if (startNum > endNum || endNum - startNum > 31536000000) return [];

    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(endDateStr + "T23:59:59");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const daysList: DayData[] = [];
    const currentDate = new Date(start);
    const registrosEnRango = historico.filter(r => {
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
      const turno = horarioArray.find(h => h.diaIndice === diaBackend);
      const esLaborable = turno?.esLaborable || false;

      const registrosDelDia = registrosEnRango.filter(r => formatDateToYMD(new Date(r.fechaHora)) === fechaStr);
      let estado: DayData["estado"] = "DESCANSO";
      let minutosRetardo = 0;

      if (esLaborable) {
        const entradaReg = registrosDelDia.find(r => r.tipoMovimiento.toUpperCase() === "ENTRADA" || r.tipoMovimiento.toUpperCase() === "RETARDO");
        if (!entradaReg) {
          const ahora = timeService.now();
          if (fechaStr === formatDateToYMD(ahora) || fechaActual > ahora) estado = "INCOMPLETO";
          else estado = "FALTA";
        } else {
          if (turno && turno.entrada) {
            const [hE, mE] = turno.entrada.split(":").map(Number);
            const expectedTime = new Date(fechaActual);
            expectedTime.setHours(hE, mE, 0, 0);
            const realTime = new Date(entradaReg.fechaHora);
            minutosRetardo = (realTime.getTime() - expectedTime.getTime()) / 60000;
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

      if (!(estado === "INCOMPLETO" && registrosDelDia.length === 0) && !(estado === "DESCANSO" && registrosDelDia.length === 0)) {
        daysList.push({ fecha: fechaActual, fechaStr, esLaborable, turno, registros: registrosDelDia, estado, minutosRetardo });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return daysList.reverse();
  }, [startDateStr, endDateStr, historico, horarioArray, user]);

  const getSemaforoUI = (estado: DayData["estado"]) => {
    switch (estado) {
      case "A_TIEMPO": return { text: "A Tiempo", icon: checkmarkCircleOutline, bg: "bg-emerald-50/80", border: "border-emerald-200", textCol: "text-emerald-700" };
      case "RETARDO": return { text: "Retardo", icon: alertCircleOutline, bg: "bg-amber-50/80", border: "border-amber-200", textCol: "text-amber-700" };
      case "RETARDO_MAYOR": return { text: "Retardo Mayor", icon: alertCircleOutline, bg: "bg-orange-50/80", border: "border-orange-200", textCol: "text-orange-700" };
      case "FALTA": return { text: "Falta", icon: closeCircleOutline, bg: "bg-red-50/80", border: "border-red-200", textCol: "text-red-700" };
      case "DESCANSO": return { text: "Descanso Lab.", icon: checkmarkCircleOutline, bg: "bg-slate-100", border: "border-slate-200", textCol: "text-slate-600" };
      default: return null;
    }
  };

  const formatDelay = (minutos: number) => {
    if (minutos <= 0) return "A tiempo";
    const hrs = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    return hrs > 0 ? `+${hrs}h ${mins}m` : `+${mins}m`;
  };

  return (
    <IonPage id="historial-page" className="bg-slate-100">
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white/80 backdrop-blur-lg border-b border-slate-100" style={{ "--background": "transparent" }}>
          <IonButtons slot="start" className="pl-1">
            <IonMenuButton className="text-slate-700" />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-800 text-lg">
            Historial
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-xl mx-auto py-4">
          {!user ? (
            <div className="text-center text-slate-500 font-bold mt-10">
              Inicia sesión para ver tu historial.
            </div>
          ) : (
            <>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-5 w-full box-border relative overflow-hidden">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <IonIcon icon={filterOutline} className="text-blue-500 text-lg" />
                  </div>
                  <span className="font-black tracking-wide text-slate-800 text-sm uppercase">
                    Filtro de Fechas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <div className="w-full">
                    <label className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-widest ml-1 block mb-1.5">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-widest ml-1 block mb-1.5">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200 text-sm text-center shadow-sm">
                  {error}
                </div>
              ) : diasDetallados.length === 0 ? (
                <div className="text-center mt-8 bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
                  <IonIcon icon={calendarOutline} className="text-slate-200 text-6xl mb-4 block mx-auto" />
                  <p className="text-slate-800 font-black tracking-wide text-lg">Historial Vacío</p>
                  <p className="text-slate-500 font-medium text-xs mt-2">
                    No tienes registros en este periodo.
                  </p>
                </div>
              ) : (
                <div className="w-full box-border pb-8">
                  {diasDetallados.map((dia, idx) => (
                    <DiaHistorialItem 
                      key={idx} 
                      dia={dia} 
                      getSemaforoUI={getSemaforoUI} 
                      formatDelay={formatDelay} 
                    />
                  ))}
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
