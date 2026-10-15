import React, { useState, useEffect } from "react";
import {
  CrearSolicitud,
  ActualizarSolicitud,
  SolicitudVacacion,
  DatosInicialesVacaciones,
  CalcularFechasResponse,
} from "../services/vacacionesService";
import { IonIcon, IonSpinner, useIonToast } from "@ionic/react";
import {
  saveOutline,
  warningOutline,
  alertCircleOutline,
  personOutline,
  closeCircleOutline,
  createOutline,
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";
import { MiniCalendario } from "./MiniCalendario";
import { useAuthSession } from "../context/AuthSessionContext";
import { TurnoDetalleDto } from "../types/api";

interface FormularioProps {
  compania: number;
  m103: number;
  datosIniciales: DatosInicialesVacaciones;
  solicitudes?: SolicitudVacacion[];
  calculoFechas: CalcularFechasResponse | null;
  loadingCalculo: boolean;
  loadingSubmit: boolean;
  solicitudEditar?: SolicitudVacacion | null;
  onCancelarEdicion?: () => void;
  onCalcularFechas: (
    fechaInicio: string,
    diasSolicitados: number,
    periodo: string,
  ) => void;
  onSubmit: (
    data: CrearSolicitud,
  ) => Promise<{ success: boolean; message: string }>;
  onActualizar?: (
    data: ActualizarSolicitud,
  ) => Promise<{ success: boolean; message: string }>;
  onSuccess: () => void;
  clearCalculo: () => void;
}

export const FormularioVacaciones: React.FC<FormularioProps> = ({
  compania,
  m103,
  datosIniciales,
  solicitudes = [],
  calculoFechas,
  loadingCalculo,
  loadingSubmit,
  solicitudEditar,
  onCancelarEdicion,
  onCalcularFechas,
  onSubmit,
  onActualizar,
  onSuccess,
  clearCalculo,
}) => {
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();

  const normPeriodo = (p?: string) =>
    (p || "").replace(/[\s-]/g, "").toLowerCase();

  const esSolicitudPendiente = (s: SolicitudVacacion): boolean => {
    const est = (s.estatus || "").trim().toUpperCase();
    const can = (s.cancelada || "").trim().toUpperCase();
    if (can === "S" || est === "C") return false;
    if (est === "A" || est === "N") return false;
    return true;
  };

  const matchPeriodo = (p1?: string, p2?: string): boolean => {
    if (!p1 || !p2) return true;
    const c1 = normPeriodo(p1);
    const c2 = normPeriodo(p2);
    return c1 === c2 || c1.includes(c2) || c2.includes(c1);
  };

  const periodo =
    solicitudEditar?.periodo || datosIniciales.periodoActual?.periodo || "";
  const diasDisponiblesBase =
    datosIniciales.periodoActual?.diasDisponibles ??
    (() => {
      const match =
        datosIniciales.periodoActual?.descripcion?.match(/\((\d+)\)/);
      return match ? parseInt(match[1], 10) : 0;
    })();

  const solicitudesPendientes = (solicitudes || []).filter(
    (s) => esSolicitudPendiente(s) && matchPeriodo(s.periodo, periodo),
  );

  const totalDiasPendientes = solicitudesPendientes.reduce(
    (sum, s) => sum + (Number(s.diasSolicitados) || 0),
    0,
  );

  const diasPendientesOtras = solicitudEditar
    ? solicitudesPendientes
        .filter((s) => Number(s.numero) !== Number(solicitudEditar.numero))
        .reduce((sum, s) => sum + (Number(s.diasSolicitados) || 0), 0)
    : totalDiasPendientes;

  const diasDisponibles = Math.max(
    0,
    diasDisponiblesBase - diasPendientesOtras,
  );

  let inicioSemana = 0;
  if (user?.horario) {
    let horarioArray: TurnoDetalleDto[] = [];
    if (Array.isArray(user.horario)) {
      horarioArray = user.horario;
    } else if (user.horario && typeof user.horario === "object") {
      const h = user.horario as any;
      if (h.dias && Array.isArray(h.dias)) {
        horarioArray = h.dias;
      } else {
        const possibleArray = Object.values(user.horario).find((val) =>
          Array.isArray(val),
        );
        if (possibleArray) {
          horarioArray = possibleArray as TurnoDetalleDto[];
        }
      }
    }
    if (horarioArray.length > 0) {
      horarioArray.sort((a, b) => (a.diaIndice ?? 99) - (b.diaIndice ?? 99));
      if (horarioArray[0].diaIndice !== undefined) {
        inicioSemana = horarioArray[0].diaIndice;
      }
    }
  }

  const minConfig = user?.minimoVacaciones ?? (user as any)?.MinimoVacaciones;
  const maxConfig = user?.maximoVacaciones ?? (user as any)?.MaximoVacaciones;

  const minDias = Math.max(1, minConfig && minConfig > 0 ? minConfig : 1);
  const diasPeriodoCompleto = Math.max(
    diasDisponiblesBase || 0,
    diasDisponibles || 0,
  );
  const maxDias = Math.max(
    minDias,
    typeof maxConfig === "number" && maxConfig > 0
      ? maxConfig
      : typeof maxConfig === "number" && maxConfig === 0
        ? Math.max(minDias, diasPeriodoCompleto || 10)
        : Math.max(minDias, diasPeriodoCompleto, 10),
  );

  const opcionesDias: number[] = [];
  for (let d = minDias; d <= maxDias; d++) {
    opcionesDias.push(d);
  }
  if (
    solicitudEditar?.diasSolicitados &&
    !opcionesDias.includes(solicitudEditar.diasSolicitados)
  ) {
    opcionesDias.push(solicitudEditar.diasSolicitados);
    opcionesDias.sort((a, b) => a - b);
  }

  const [diasSolicitados, setDiasSolicitados] = useState(String(minDias));
  const [fechaInicio, setFechaInicio] = useState("");
  const [comentariosEmpleado, setComentariosEmpleado] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState<boolean>(false);

  const numDias = Number(diasSolicitados) || 0;
  const diasExcedentes = Math.max(0, numDias - diasDisponibles);

  const getPeriodoSiguiente = (p: string): string => {
    if (calculoFechas?.periodoAnticipado)
      return calculoFechas.periodoAnticipado;
    const matchRange = p.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (matchRange) {
      const y1 = parseInt(matchRange[1], 10) + 1;
      const y2 = parseInt(matchRange[2], 10) + 1;
      return `${y1}-${y2}`;
    }
    const matchYear = p.match(/^(\d{4})$/);
    if (matchYear) {
      return String(parseInt(matchYear[1], 10) + 1);
    }
    return "siguiente periodo";
  };

  const periodoSiguiente =
    calculoFechas?.periodoAnticipado || getPeriodoSiguiente(periodo);

  const tieneAnticipadosReales =
    diasExcedentes > 0 || calculoFechas?.tieneDiasAnticipados === "S";

  const diasAnticipadosFinal = Math.max(
    calculoFechas?.diasAnticipados || 0,
    diasExcedentes,
  );

  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = getLocalDateStr(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = getLocalDateStr(tomorrow);

  useEffect(() => {
    if (solicitudEditar) {
      const fInicio = (solicitudEditar.fechaInicio || "").replace(/\//g, "-");
      setFechaInicio(fInicio);
      setDiasSolicitados(String(solicitudEditar.diasSolicitados || minDias));
      setComentariosEmpleado(solicitudEditar.comentariosEmpleado || "");
      setErrorMsg(null);
    } else {
      setFechaInicio("");
      setDiasSolicitados(String(minDias));
      setComentariosEmpleado("");
      setErrorMsg(null);
      clearCalculo();
    }
  }, [solicitudEditar, minDias]);

  const handleFechaChange = (val: string) => {
    setErrorMsg(null);
    if (!val) {
      setFechaInicio("");
      clearCalculo();
      return;
    }

    if (val <= todayStr) {
      setFechaInicio("");
      clearCalculo();
      const msg =
        val === todayStr
          ? "No puedes solicitar vacaciones para el día de hoy. Selecciona a partir de mañana."
          : "No puedes seleccionar fechas pasadas. Selecciona una fecha a partir de mañana.";
      setErrorMsg(msg);
      presentToast({
        message: msg,
        duration: 3500,
        color: "warning",
        position: "top",
      });
      return;
    }

    const cleanDateSlash = val.replace(/-/g, "/");
    if (datosIniciales.fechasRestringidas?.includes(cleanDateSlash)) {
      setFechaInicio("");
      clearCalculo();
      const msg = "No puedes iniciar tus vacaciones en una fecha restringida.";
      setErrorMsg(msg);
      presentToast({
        message: msg,
        duration: 3500,
        color: "danger",
        position: "top",
      });
      return;
    }

    setFechaInicio(val);
  };

  useEffect(() => {
    if (fechaInicio && Number(diasSolicitados) > 0 && periodo) {
      onCalcularFechas(fechaInicio, Number(diasSolicitados), periodo);
    } else {
      clearCalculo();
    }
  }, [fechaInicio, diasSolicitados, periodo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!Number(diasSolicitados) || Number(diasSolicitados) < 1) {
      return setErrorMsg("Debes seleccionar una cantidad de días válida.");
    }

    if (!fechaInicio || (!solicitudEditar && fechaInicio <= todayStr)) {
      return setErrorMsg(
        "Debes seleccionar una fecha de inicio válida a partir de mañana.",
      );
    }

    if (!calculoFechas) {
      return setErrorMsg(
        "Debes seleccionar una fecha de inicio válida para calcular el periodo.",
      );
    }

    if (
      datosIniciales.fechasRestringidas?.includes(
        fechaInicio.replace(/-/g, "/"),
      )
    ) {
      return setErrorMsg(
        "No puedes iniciar tus vacaciones en una fecha restringida.",
      );
    }

    if (solicitudEditar && onActualizar) {
      const updatePayload: ActualizarSolicitud = {
        compania,
        m103,
        numero: solicitudEditar.numero,
        fechaInicio: fechaInicio.replace(/-/g, "/"),
        fechaFin: calculoFechas.fechaFin,
        fechaRetorno: calculoFechas.fechaRetorno,
        diasSolicitados: Number(diasSolicitados),
        comentariosEmpleado,
        tieneRestriccion: calculoFechas.cruzaRestringidas ? "S" : "N",
        fechasRestringidas: calculoFechas.fechasRestringidasCruzadas || "",
        tieneDiasAnticipados: tieneAnticipadosReales ? "S" : "N",
        diasAnticipados: tieneAnticipadosReales ? diasAnticipadosFinal : 0,
        periodoAnticipado: tieneAnticipadosReales ? periodoSiguiente : "",
        fechasAnticipadas: calculoFechas.fechasAnticipadas || "",
      };

      const res = await onActualizar(updatePayload);
      if (res.success) {
        setFechaInicio("");
        setDiasSolicitados(String(minDias));
        setComentariosEmpleado("");
        clearCalculo();
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    const payload: CrearSolicitud = {
      compania,
      m103,
      nombreEmpleado: datosIniciales.nombreEmpleado || user?.nombre || "",
      periodo,
      correoEmpleado: datosIniciales.correoEmpleado,
      fechaInicio: fechaInicio.replace(/-/g, "/"),
      fechaFin: calculoFechas.fechaFin,
      fechaRetorno: calculoFechas.fechaRetorno,
      diasSolicitados: Number(diasSolicitados),
      comentariosEmpleado,
      jefeInmediato: datosIniciales.jefeInmediato,
      tieneRestriccion: calculoFechas.cruzaRestringidas ? "S" : "N",
      fechasRestringidas: calculoFechas.fechasRestringidasCruzadas || "",
      tieneDiasAnticipados: tieneAnticipadosReales ? "S" : "N",
      diasAnticipados: tieneAnticipadosReales ? diasAnticipadosFinal : 0,
      periodoAnticipado: tieneAnticipadosReales ? periodoSiguiente : "",
      fechasAnticipadas: calculoFechas.fechasAnticipadas || "",
    };

    const res = await onSubmit(payload);
    if (res.success) {
      setFechaInicio("");
      setDiasSolicitados(String(minDias));
      setComentariosEmpleado("");
      clearCalculo();
      onSuccess();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100/90 shadow-sm mt-3 sm:mt-4 space-y-4 sm:space-y-5 overflow-hidden"
    >
      {solicitudEditar && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 tracking-wider">
              <IonIcon icon={createOutline} className="text-sm" /> Modo Edición
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
              Modificando Solicitud #{solicitudEditar.numero}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 truncate">
              Periodo {solicitudEditar.periodo}
            </p>
          </div>
          {onCancelarEdicion && (
            <button
              type="button"
              onClick={onCancelarEdicion}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors shrink-0"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
          <IonIcon icon={warningOutline} className="text-lg shrink-0 mt-0.5" />
          <p className="leading-snug">{errorMsg}</p>
        </div>
      )}

      <div className="bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0">
          <IonIcon icon={personOutline} className="text-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Supervisor que Autoriza
          </p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {datosIniciales.jefeInmediatoNombre || "Sin asignar"}
          </p>
          <p className="text-xs font-medium text-slate-400 truncate">
            {datosIniciales.jefeInmediatoCorreo || "Sin correo"}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 p-3.5 sm:p-4 rounded-2xl border border-blue-100/90 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
            {diasDisponibles < 10 ? `0${diasDisponibles}` : diasDisponibles}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-blue-600/80 tracking-wider">
              {solicitudEditar
                ? "Días Disponibles para Modificar"
                : "Días Disponibles"}
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              Tienes{" "}
              <span className="text-blue-600 font-black">
                {diasDisponibles} {diasDisponibles === 1 ? "día" : "días"}
              </span>{" "}
              {solicitudEditar ? "para esta solicitud" : "para solicitar"}
            </p>
            {diasPendientesOtras > 0 && (
              <p className="text-[11px] font-semibold text-amber-700 truncate mt-0.5">
                • {diasPendientesOtras}{" "}
                {diasPendientesOtras === 1
                  ? "día pendiente"
                  : "días pendientes"}{" "}
                de aprobación
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 ml-1 truncate">
            Periodo Actual
          </label>
          <div className="w-full min-w-0 text-xs sm:text-sm font-black text-blue-700 px-3 py-3 sm:px-4 rounded-2xl border border-blue-200/80 bg-blue-50/70 shadow-xs flex items-center justify-center min-h-[48px] text-center truncate">
            {periodo || "Sin Periodo"}
          </div>
        </div>
        <div className="min-w-0">
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 ml-1 truncate">
            Días a tomar
          </label>
          <div className="relative min-w-0">
            <select
              value={diasSolicitados}
              onChange={(e) => setDiasSolicitados(e.target.value)}
              className="w-full min-w-0 block appearance-none text-xs sm:text-sm font-bold text-slate-700 px-3 py-3 sm:px-4 pr-8 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all min-h-[48px]"
            >
              {opcionesDias.map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "Día" : "Días"}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 ml-1">
          Fecha de Inicio
        </label>
        <div className="min-w-0 w-full">
          <input
            required
            type="date"
            min={minDateStr}
            value={fechaInicio}
            onChange={(e) => handleFechaChange(e.target.value)}
            className="w-full max-w-full min-w-0 block text-xs sm:text-sm font-bold text-slate-700 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all min-h-[48px] box-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0 bg-slate-50/90 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 flex flex-col justify-center min-h-[58px]">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5 truncate">
            Último Día (Calculado)
          </p>
          <p className="text-xs sm:text-sm font-bold text-slate-600 truncate">
            {loadingCalculo ? (
              <IonSpinner name="dots" className="w-4 h-4" />
            ) : (
              calculoFechas?.fechaFin || "---"
            )}
          </p>
        </div>
        <div className="min-w-0 bg-blue-50/70 p-3 sm:p-3.5 rounded-2xl border border-blue-200/80 flex flex-col justify-center min-h-[58px]">
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-wider mb-0.5 truncate">
            Regreso a Laborar
          </p>
          <p className="text-xs sm:text-sm font-black text-blue-700 truncate">
            {loadingCalculo ? (
              <IonSpinner name="dots" className="w-4 h-4 text-blue-600" />
            ) : (
              calculoFechas?.fechaRetorno || "---"
            )}
          </p>
        </div>
      </div>

      {calculoFechas?.cruzaRestringidas && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
          <IonIcon
            icon={alertCircleOutline}
            className="text-lg shrink-0 mt-0.5"
          />
          <p className="leading-snug">
            El periodo cruza con días inhábiles o restringidos. Se generarán
            automáticamente múltiples solicitudes excluyendo dichas fechas.
          </p>
        </div>
      )}

      {tieneAnticipadosReales && numDias > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-2xl text-xs font-bold border border-amber-200/80 shadow-xs">
          <IonIcon
            icon={warningOutline}
            className="text-xl shrink-0 mt-0.5 text-amber-600"
          />
          <div className="space-y-1.5 leading-snug">
            <p className="font-black text-amber-900 uppercase text-[11px] tracking-wide">
              {diasDisponibles === 0
                ? "Días de periodo actual agotados"
                : "Días solicitados exceden el periodo actual"}
            </p>
            {diasDisponibles === 0 ? (
              <p>
                Ya no cuentas con días disponibles en tu periodo actual
                {periodo ? ` (${periodo})` : ""}
                {diasPendientesOtras > 0
                  ? ` al considerar tus ${diasPendientesOtras} ${
                      diasPendientesOtras === 1
                        ? "día pendiente"
                        : "días pendientes"
                    } de autorización`
                  : ""}
                . Los{" "}
                <span className="font-black text-amber-950">
                  {numDias}{" "}
                  {numDias === 1 ? "día solicitado" : "días solicitados"}
                </span>{" "}
                se tomarán por anticipado del siguiente periodo{" "}
                <span className="font-black text-amber-950">
                  ({periodoSiguiente})
                </span>{" "}
                una vez que se autoricen tus solicitudes.
              </p>
            ) : (
              <p>
                De los {numDias} días solicitados, {diasDisponibles} se cubrirán
                con tu periodo actual{periodo ? ` (${periodo})` : ""}. Los{" "}
                <span className="font-black text-amber-950">
                  {diasAnticipadosFinal}{" "}
                  {diasAnticipadosFinal === 1
                    ? "día restante"
                    : "días restantes"}
                </span>{" "}
                se tomarán por anticipado del siguiente periodo{" "}
                <span className="font-black text-amber-950">
                  ({periodoSiguiente})
                </span>
                {diasPendientesOtras > 0
                  ? `, considerando tus ${diasPendientesOtras} ${
                      diasPendientesOtras === 1
                        ? "día pendiente"
                        : "días pendientes"
                    } en espera de autorización`
                  : ""}
                .
              </p>
            )}
          </div>
        </div>
      )}

      {calculoFechas && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setMostrarCalendario(!mostrarCalendario)}
            className={`w-full p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 ${
              mostrarCalendario
                ? "bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/10"
                : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  mostrarCalendario
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <IonIcon icon={calendarOutline} className="text-base" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Ver días en el calendario
                </span>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  {numDias}{" "}
                  {numDias === 1 ? "día de vacaciones" : "días de vacaciones"}
                  {calculoFechas.fechaRetorno
                    ? ` · Regreso el ${calculoFechas.fechaRetorno}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <IonIcon
                icon={mostrarCalendario ? chevronUpOutline : chevronDownOutline}
                className={`text-base transition-colors ${
                  mostrarCalendario ? "text-blue-600" : "text-slate-400"
                }`}
              />
            </div>
          </button>

          {mostrarCalendario && (
            <div className="mt-2">
              <MiniCalendario
                fechaInicio={fechaInicio}
                fechaFin={calculoFechas.fechaFin}
                fechaRetorno={calculoFechas.fechaRetorno}
                diasEfectivos={calculoFechas.diasEfectivos}
                diasInhabiles={calculoFechas.diasInhabiles}
                diasRestringidos={datosIniciales.fechasRestringidas}
                inicioSemana={inicioSemana}
              />
            </div>
          )}
        </div>
      )}

      <div className="min-w-0">
        <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5 ml-1">
          Comentarios (Opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Agrega un comentario..."
          value={comentariosEmpleado}
          onChange={(e) => setComentariosEmpleado(e.target.value)}
          className="w-full min-w-0 block text-xs sm:text-sm font-bold text-slate-700 p-3 sm:p-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none box-border"
        ></textarea>
      </div>

      {solicitudEditar ? (
        <div className="flex gap-2.5 pt-1">
          {onCancelarEdicion && (
            <button
              type="button"
              onClick={onCancelarEdicion}
              className="w-1/3 h-13 sm:h-14 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-[0.98] flex items-center justify-center"
            >
              Cancelar
            </button>
          )}
          <button
            disabled={loadingSubmit || !calculoFechas}
            type="submit"
            className="flex-1 h-13 sm:h-14 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all duration-300 bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg hover:shadow-amber-200 disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loadingSubmit ? (
              <IonSpinner name="crescent" className="w-5 h-5 text-white" />
            ) : (
              <>
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          disabled={loadingSubmit || !calculoFechas}
          type="submit"
          className="w-full mt-2 h-13 sm:h-14 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loadingSubmit ? (
            <IonSpinner name="crescent" className="w-5 h-5 text-white" />
          ) : (
            <span>Enviar Solicitud</span>
          )}
        </button>
      )}
    </form>
  );
};
