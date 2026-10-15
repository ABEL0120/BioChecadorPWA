import React, { useState, useEffect } from "react";
import {
  CrearPermiso,
  ActualizarPermiso,
  PermisoEmpleado,
  DatosInicialesPermisos,
  CalcularTiempoResponse,
  CalcularTiempoRequest,
} from "../services/permisosService";
import { IonIcon, IonSpinner, useIonToast } from "@ionic/react";
import {
  warningOutline,
  personOutline,
  createOutline,
  timeOutline,
  sparklesOutline,
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
  logInOutline,
  logOutOutline,
  swapHorizontalOutline,
  calendarClearOutline,
} from "ionicons/icons";
import { MiniCalendario } from "./MiniCalendario";
import { useAuthSession } from "../context/AuthSessionContext";
import { TurnoDetalleDto } from "../types/api";

interface FormularioPermisoProps {
  compania: number;
  m103: number;
  datosIniciales: DatosInicialesPermisos;
  permisoEditar?: PermisoEmpleado | null;
  onCancelarEdicion?: () => void;
  onSubmit: (
    data: CrearPermiso,
  ) => Promise<{ success: boolean; message: string }>;
  onActualizar?: (
    data: ActualizarPermiso,
  ) => Promise<{ success: boolean; message: string }>;
  onSuccess: (msg?: string) => void;
  calculoTiempo: CalcularTiempoResponse | null;
  loadingCalculo: boolean;
  loadingSubmit: boolean;
  onCalcularTiempo: (req: CalcularTiempoRequest) => void;
  clearCalculo: () => void;
}

export const FormularioPermiso: React.FC<FormularioPermisoProps> = ({
  compania,
  m103,
  datosIniciales,
  permisoEditar,
  onCancelarEdicion,
  onSubmit,
  onActualizar,
  onSuccess,
  calculoTiempo,
  loadingCalculo,
  loadingSubmit,
  onCalcularTiempo,
  clearCalculo,
}) => {
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();

  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayStr = getLocalDateStr(now);

  const [esMismoDia, setEsMismoDia] = useState<boolean>(true);
  const [fechaInicio, setFechaInicio] = useState<string>(todayStr);
  const [fechaFin, setFechaFin] = useState<string>(todayStr);
  const [horaInicio, setHoraInicio] = useState<string>("09:00");
  const [horaFin, setHoraFin] = useState<string>("13:00");
  const [motivo, setMotivo] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState<boolean>(false);
  const [tipoAusencia, setTipoAusencia] = useState<
    "llegar_tarde" | "salir_temprano" | "intermedio" | "todo_dia" | "manual"
  >("manual");

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

  let horarioArray: TurnoDetalleDto[] = [];
  let inicioSemana = 0;

  if (user?.horario) {
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

  const isLaborableDay = (date: Date): boolean => {
    const dow = date.getDay();
    const nombreJS = diasSemanaJS[dow];
    if (horarioArray.length > 0) {
      const turno = horarioArray.find(
        (h) => normalizeStr(h.diaNombre) === nombreJS,
      );
      if (turno && typeof turno.esLaborable === "boolean") {
        return turno.esLaborable;
      }
    }
    return dow !== 0 && dow !== 6;
  };

  const formatDateSlash = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
  };

  const parseLocalDate = (dStr: string) => {
    const parts = dStr.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  };

  let diasLaborables: string[] = [];
  let diasDescanso: string[] = [];
  let fechaRetorno = "";

  if (fechaInicio && fechaFin && fechaInicio <= fechaFin) {
    const startD = parseLocalDate(fechaInicio);
    const endD = parseLocalDate(fechaFin);
    const cur = new Date(startD);

    while (cur <= endD) {
      const isLaborable = isLaborableDay(cur);
      const strSlash = formatDateSlash(cur);
      if (isLaborable) {
        diasLaborables.push(strSlash);
      } else {
        diasDescanso.push(strSlash);
      }
      cur.setDate(cur.getDate() + 1);
    }

    const retCur = new Date(endD);
    retCur.setDate(retCur.getDate() + 1);
    let attempts = 0;
    while (attempts < 14) {
      const isLaborable = isLaborableDay(retCur);
      if (isLaborable) {
        fechaRetorno = formatDateSlash(retCur);
        break;
      }
      diasDescanso.push(formatDateSlash(retCur));
      retCur.setDate(retCur.getDate() + 1);
      attempts++;
    }
  }

  const totalLaborables = diasLaborables.length;

  const handleSelectTipoAusencia = (
    tipo: "llegar_tarde" | "salir_temprano" | "intermedio" | "todo_dia" | "manual"
  ) => {
    setTipoAusencia((prev) => (prev === tipo ? "manual" : tipo));
  };

  const prepararHorasParaCalculo = () => {
    // Constantes oficiales (conectar aquí con el objeto user.horario según el turno)
    const HORA_ENTRADA_OFICIAL = "09:00";
    const HORA_SALIDA_OFICIAL = "18:00";

    let hi = horaInicio;
    let hf = horaFin;

    if (esMismoDia) {
      if (tipoAusencia === "todo_dia") {
        hi = HORA_ENTRADA_OFICIAL;
        hf = HORA_SALIDA_OFICIAL;
      } else if (tipoAusencia === "llegar_tarde") {
        hi = HORA_ENTRADA_OFICIAL;
        hf = horaFin;
      } else if (tipoAusencia === "salir_temprano") {
        hi = horaInicio;
        hf = HORA_SALIDA_OFICIAL;
      }
    }

    return { horaInicioCalculo: hi, horaFinCalculo: hf };
  };

  useEffect(() => {
    if (permisoEditar) {
      const fi = (permisoEditar.fechaInicioPermiso || "").replace(/\//g, "-");
      const ff = (permisoEditar.fechaFinalizaPermiso || "").replace(/\//g, "-");
      setFechaInicio(fi || todayStr);
      setFechaFin(ff || todayStr);
      setEsMismoDia(fi === ff);
      setHoraInicio(permisoEditar.horaIniciaPermiso || "09:00");
      setHoraFin(permisoEditar.horaFinalizaPermiso || "13:00");
      setTipoAusencia("manual");
      setMotivo(permisoEditar.motivoPermiso || "");
      setErrorMsg(null);
    } else {
      setFechaInicio(todayStr);
      setFechaFin(todayStr);
      setEsMismoDia(true);
      setHoraInicio("09:00");
      setHoraFin("13:00");
      setTipoAusencia("manual");
      setMotivo("");
      setErrorMsg(null);
      clearCalculo();
    }
  }, [permisoEditar, todayStr]);

  const handleTipoDiaToggle = (mismoDia: boolean) => {
    setEsMismoDia(mismoDia);
    if (mismoDia) {
      setFechaFin(fechaInicio);
    } else {
      setTipoAusencia("manual");
    }
  };

  const handleFechaInicioChange = (val: string) => {
    setFechaInicio(val);
    if (esMismoDia || val > fechaFin) {
      setFechaFin(val);
    }
  };

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const { horaInicioCalculo, horaFinCalculo } = prepararHorasParaCalculo();
      if (horaInicioCalculo && horaFinCalculo) {
        const fiSlash = fechaInicio.replace(/-/g, "/");
        const ffSlash = fechaFin.replace(/-/g, "/");
        onCalcularTiempo({
          compania,
          m103,
          fechaInicio: fiSlash,
          fechaFin: ffSlash,
          horaInicio: horaInicioCalculo,
          horaFin: horaFinCalculo,
        });
        return;
      }
    }
    clearCalculo();
  }, [
    fechaInicio,
    fechaFin,
    horaInicio,
    horaFin,
    tipoAusencia,
    esMismoDia,
    compania,
    m103,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fechaInicio || !fechaFin) {
      return setErrorMsg("Debes seleccionar fecha de inicio y fin.");
    }

    if (fechaInicio < todayStr) {
      return setErrorMsg(
        "No se pueden registrar permisos con fechas anteriores a hoy.",
      );
    }

    if (fechaFin < fechaInicio) {
      return setErrorMsg(
        "La fecha final no puede ser anterior a la fecha inicial.",
      );
    }

    const { horaInicioCalculo, horaFinCalculo } = prepararHorasParaCalculo();

    if (!horaInicioCalculo || !horaFinCalculo) {
      return setErrorMsg("Debes especificar la hora de inicio y fin.");
    }

    if (calculoTiempo && !calculoTiempo.esValido) {
      return setErrorMsg(
        calculoTiempo.errorValidacion ||
          "El horario seleccionado no es válido para solicitar permiso.",
      );
    }

    if (!motivo.trim()) {
      return setErrorMsg("Por favor escribe el motivo del permiso.");
    }

    if (motivo.trim().length < 3) {
      return setErrorMsg("El motivo debe ser más descriptivo.");
    }

    const fiClean = fechaInicio.replace(/-/g, "/");
    const ffClean = fechaFin.replace(/-/g, "/");
    const finalMotivo = motivo.trim().toUpperCase();

    if (permisoEditar && onActualizar) {
      const updatePayload: ActualizarPermiso = {
        compania,
        m103,
        numero: permisoEditar.numero,
        fechaInicio: fiClean,
        fechaFin: ffClean,
        horaInicio: horaInicioCalculo,
        horaFin: horaFinCalculo,
        motivo: finalMotivo,
        aplicaVacaciones: "N",
      };

      const res = await onActualizar(updatePayload);
      if (res.success) {
        onSuccess(res.message);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }

    const payload: CrearPermiso = {
      compania,
      m103,
      fechaInicio: fiClean,
      fechaFin: ffClean,
      horaInicio: horaInicioCalculo,
      horaFin: horaFinCalculo,
      motivo: finalMotivo,
      aplicaVacaciones: "N",
    };

    const res = await onSubmit(payload);
    if (res.success) {
      onSuccess(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm mt-3 sm:mt-4 space-y-5"
    >
      {permisoEditar && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700 tracking-wider">
              <IonIcon icon={createOutline} className="text-sm" /> Modo Edición
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
              Modificando Permiso #{permisoEditar.numero}
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
          <IonIcon icon={warningOutline} className="text-lg shrink-0 mt-0.5" />
          <p className="leading-snug">{errorMsg}</p>
        </div>
      )}

      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 gap-2.5 items-center">
        <div className="flex items-center gap-2.5 min-w-0 w-full">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <IonIcon icon={personOutline} className="text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Autoriza
            </p>
            <p className="text-xs font-bold text-slate-800">
              {datosIniciales.jefeInmediatoNombre || "Sin asignar"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="bg-slate-100 p-1 rounded-xl flex w-full h-12">
          <button
            type="button"
            onClick={() => handleTipoDiaToggle(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              esMismoDia
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Mismo día
          </button>
          <button
            type="button"
            onClick={() => handleTipoDiaToggle(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !esMismoDia
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Varios días
          </button>
        </div>

        <div
          className={`grid ${esMismoDia ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-3`}
        >
          <div className="min-w-0">
            <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1 ml-1">
              {esMismoDia ? "Fecha del Permiso" : "Fecha Inicio"}
            </label>
            <input
              required
              type="date"
              min={todayStr}
              value={fechaInicio}
              onChange={(e) => handleFechaInicioChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {!esMismoDia && (
            <div className="min-w-0">
              <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1 ml-1">
                Fecha Fin
              </label>
              <input
                required
                type="date"
                min={fechaInicio || todayStr}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
          )}
        </div>

        {esMismoDia && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider ml-1">
              ¿Qué tipo de permiso necesitas?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTipoAusencia("llegar_tarde")}
                className={`p-4 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[96px] sm:min-h-[105px] ${
                  tipoAusencia === "llegar_tarde"
                    ? "bg-blue-50/30 border-2 border-blue-500 text-blue-700 shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors ${
                    tipoAusencia === "llegar_tarde"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <IonIcon icon={logInOutline} />
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  Llegar tarde
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoAusencia("salir_temprano")}
                className={`p-4 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[96px] sm:min-h-[105px] ${
                  tipoAusencia === "salir_temprano"
                    ? "bg-blue-50/30 border-2 border-blue-500 text-blue-700 shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors ${
                    tipoAusencia === "salir_temprano"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <IonIcon icon={logOutOutline} />
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  Salir temprano
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoAusencia("intermedio")}
                className={`p-4 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[96px] sm:min-h-[105px] ${
                  tipoAusencia === "intermedio"
                    ? "bg-blue-50/30 border-2 border-blue-500 text-blue-700 shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors ${
                    tipoAusencia === "intermedio"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <IonIcon icon={swapHorizontalOutline} />
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  Salir y regresar
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoAusencia("todo_dia")}
                className={`p-4 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[96px] sm:min-h-[105px] ${
                  tipoAusencia === "todo_dia"
                    ? "bg-blue-50/30 border-2 border-blue-500 text-blue-700 shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors ${
                    tipoAusencia === "todo_dia"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <IonIcon icon={calendarClearOutline} />
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  Faltar todo el día
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTipoAusencia("manual")}
                className={`col-span-2 p-3.5 sm:p-4 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[88px] ${
                  tipoAusencia === "manual"
                    ? "bg-blue-50/30 border-2 border-blue-500 text-blue-700 shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-colors ${
                    tipoAusencia === "manual"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <IonIcon icon={timeOutline} />
                </div>
                <span className="text-xs sm:text-sm font-bold">
                  Personalizado
                </span>
              </button>
            </div>
          </div>
        )}

        {(!esMismoDia || tipoAusencia !== "todo_dia") && (
          <div
            className={`grid ${
              esMismoDia &&
              (tipoAusencia === "llegar_tarde" || tipoAusencia === "salir_temprano")
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2"
            } gap-3`}
          >
            {(!esMismoDia ||
              tipoAusencia === "intermedio" ||
              tipoAusencia === "manual" ||
              tipoAusencia === "salir_temprano") && (
              <div className="min-w-0">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1 ml-1">
                  {esMismoDia && tipoAusencia === "salir_temprano"
                    ? "A partir de qué hora"
                    : esMismoDia
                    ? "Hora de Salida"
                    : "Hora Inicio"}
                </label>
                <input
                  required
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            )}

            {(!esMismoDia ||
              tipoAusencia === "intermedio" ||
              tipoAusencia === "manual" ||
              tipoAusencia === "llegar_tarde") && (
              <div className="min-w-0">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1 ml-1">
                  {esMismoDia && tipoAusencia === "llegar_tarde"
                    ? "Hora estimada de llegada"
                    : esMismoDia
                    ? "Hora de Regreso"
                    : "Hora Fin"}
                </label>
                <input
                  required
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            )}
          </div>
        )}

        {!esMismoDia && totalLaborables > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMostrarCalendario(!mostrarCalendario)}
              className={`w-full py-4 px-4.5 sm:py-5 sm:px-5 min-h-19 sm:min-h-20.5 rounded-2xl sm:rounded-3xl border transition-all text-left flex items-center justify-between gap-3.5 shadow-xs ${
                mostrarCalendario
                  ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10"
                  : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    mostrarCalendario
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-blue-100/80 text-blue-600"
                  }`}
                >
                  <IonIcon icon={calendarOutline} className="text-2xl" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-black text-slate-800 block tracking-tight">
                    Ver días en el calendario
                  </span>
                  <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                    {totalLaborables}{" "}
                    {totalLaborables === 1
                      ? "día hábil de permiso"
                      : "días hábiles de permiso"}
                    {fechaRetorno ? ` · Regreso el ${fechaRetorno}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    mostrarCalendario
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-200/60 text-slate-400"
                  }`}
                >
                  <IonIcon
                    icon={
                      mostrarCalendario ? chevronUpOutline : chevronDownOutline
                    }
                    className="text-base"
                  />
                </div>
              </div>
            </button>

            {mostrarCalendario && (
              <div className="mt-2">
                <MiniCalendario
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  fechaRetorno={fechaRetorno}
                  diasEfectivos={diasLaborables}
                  diasInhabiles={diasDescanso}
                  inicioSemana={inicioSemana}
                  labelEfectivos="Permiso"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-1">
        <div>
          <div className="flex justify-between items-center mb-1 ml-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Motivo del Permiso
            </label>
            <span className="text-[10px] font-bold text-slate-400">
              {motivo.length}/500
            </span>
          </div>
          <textarea
            required
            rows={3}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Escribe la razón detallada de tu permiso (ej. Cita médica, trámite personal, asunto escolar...)"
            className="w-full text-xs sm:text-sm font-medium text-slate-700 p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all resize-none box-border"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                {loadingCalculo ? (
                  <IonSpinner name="dots" className="w-5 h-5 text-white" />
                ) : (
                  <IonIcon icon={timeOutline} className="text-xl" />
                )}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-blue-600 tracking-wider">
                  Tiempo Efectivo del Permiso
                </span>
                <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-tight">
                  {loadingCalculo ? (
                    "Calculando..."
                  ) : calculoTiempo && calculoTiempo.esValido ? (
                    calculoTiempo.tiempoTexto
                  ) : (
                    <span className="text-red-600 text-xs font-bold">
                      {calculoTiempo?.errorValidacion || "Horario inválido"}
                    </span>
                  )}
                </p>
                {calculoTiempo?.mensajeDetalle && (
                  <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {calculoTiempo.mensajeDetalle}
                  </p>
                )}
              </div>
            </div>

            {calculoTiempo && calculoTiempo.esValido && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Válido</span>
              </div>
            )}
          </div>
        </div>

        {permisoEditar ? (
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
              type="submit"
              disabled={
                loadingSubmit ||
                (calculoTiempo !== null && !calculoTiempo.esValido)
              }
              className={`flex-1 h-13 sm:h-14 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 ${
                loadingSubmit ||
                (calculoTiempo !== null && !calculoTiempo.esValido)
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg hover:shadow-amber-200"
              }`}
            >
              {loadingSubmit ? (
                <IonSpinner name="crescent" className="w-4 h-4 text-white" />
              ) : (
                <>
                  {/* <IonIcon icon={sparklesOutline} className="text-base" /> */}
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={
              loadingSubmit ||
              (calculoTiempo !== null && !calculoTiempo.esValido)
            }
            className={`w-full h-13 sm:h-14 rounded-2xl font-black text-sm uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
              loadingSubmit ||
              (calculoTiempo !== null && !calculoTiempo.esValido)
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30"
            }`}
          >
            {loadingSubmit ? (
              <IonSpinner name="crescent" className="w-4 h-4 text-white" />
            ) : (
              <>
                {/* <IonIcon icon={sparklesOutline} className="text-lg" /> */}
                <span>Enviar Solicitud</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};
