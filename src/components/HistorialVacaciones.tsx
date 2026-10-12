import React, { useState, useMemo } from "react";
import {
  SolicitudVacacion,
  PeriodoVacacion,
} from "../services/vacacionesService";
import { IonIcon, IonSpinner } from "@ionic/react";
import {
  calendarOutline,
  timeOutline,
  closeCircleOutline,
  createOutline,
} from "ionicons/icons";

interface HistorialProps {
  solicitudes: SolicitudVacacion[];
  periodos: PeriodoVacacion[];
  loading: boolean;
  onEditar?: (solicitud: SolicitudVacacion) => void;
  onCancelar: (
    numero: number,
    comentarios: string,
  ) => Promise<{ success: boolean; message: string }>;
}

export const HistorialVacaciones: React.FC<HistorialProps> = ({
  solicitudes,
  periodos,
  loading,
  onEditar,
  onCancelar,
}) => {
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelComment, setCancelComment] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("TODOS");

  const solicitudesFiltradas = useMemo(() => {
    if (filtroPeriodo === "TODOS") return solicitudes;
    return solicitudes.filter((s) => s.periodo === filtroPeriodo);
  }, [solicitudes, filtroPeriodo]);

  const esSolicitudPendiente = (estatus?: string, cancelada?: string): boolean => {
    const est = (estatus || "").trim().toUpperCase();
    const can = (cancelada || "").trim().toUpperCase();
    if (can === "S" || est === "C") return false;
    if (est === "A" || est === "N") return false;
    return true;
  };

  const getStatusBadge = (estatus: string, cancelada: string) => {
    if (cancelada === "S" || (estatus || "").trim().toUpperCase() === "C") {
      return (
        <span className="px-3 py-1 text-[10px] font-black rounded-xl bg-slate-100 text-slate-500 uppercase tracking-widest border border-slate-200">
          Cancelada
        </span>
      );
    }
    const est = (estatus || "").trim().toUpperCase();
    switch (est) {
      case "A":
        return (
          <span className="px-3 py-1 text-[10px] font-black rounded-xl bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-200">
            Aprobada
          </span>
        );
      case "N":
        return (
          <span className="px-3 py-1 text-[10px] font-black rounded-xl bg-red-50 text-red-600 uppercase tracking-widest border border-red-200">
            Rechazada
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-[10px] font-black rounded-xl bg-amber-50 text-amber-600 uppercase tracking-widest border border-amber-200">
            Pendiente
          </span>
        );
    }
  };

  const handleConfirmCancel = async (numero: number) => {
    const res = await onCancelar(numero, cancelComment);
    if (res.success) {
      setCancelId(null);
      setCancelComment("");
    } else {
      alert(res.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (!solicitudes || solicitudes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
        <IonIcon
          icon={calendarOutline}
          className="text-5xl text-slate-300 mb-2"
        />
        <p className="text-sm font-bold text-slate-400">
          No hay solicitudes registradas
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {periodos.length > 0 && (
        <div className="mb-4">
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="w-full text-sm font-bold text-slate-700 p-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition-colors appearance-none shadow-sm"
          >
            <option value="TODOS">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p.periodo} value={p.periodo}>
                {p.descripcion}
              </option>
            ))}
          </select>
        </div>
      )}

      {solicitudesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-sm font-bold text-slate-400">
            No se encontraron solicitudes para este periodo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudesFiltradas.map((sol) => (
            <div
              key={sol.numero}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-black text-blue-500 tracking-widest uppercase mb-0.5">
                    Periodo {sol.periodo}
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    {sol.diasSolicitados}{" "}
                    {sol.diasSolicitados === 1
                      ? "Día Solicitado"
                      : "Días Solicitados"}
                  </div>
                </div>
                {getStatusBadge(sol.estatus, sol.cancelada)}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-bold mb-4 border border-slate-100">
                <IonIcon
                  icon={timeOutline}
                  className="text-blue-500 text-lg shrink-0"
                />
                <span>
                  Del {sol.fechaInicio} al {sol.fechaFin}
                </span>
              </div>

              {esSolicitudPendiente(sol.estatus, sol.cancelada) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {cancelId === sol.numero ? (
                      <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                            Motivo de cancelación (Opcional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Escribe el motivo de la cancelación..."
                            value={cancelComment}
                            onChange={(e) => setCancelComment(e.target.value)}
                            className="w-full text-xs sm:text-sm font-bold text-slate-700 p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all resize-none box-border leading-relaxed"
                          />
                        </div>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={() => {
                              setCancelId(null);
                              setCancelComment("");
                            }}
                            className="flex-1 h-12 sm:h-13 rounded-2xl text-xs sm:text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center"
                          >
                            Volver
                          </button>
                          <button
                            onClick={() => handleConfirmCancel(sol.numero)}
                            className="flex-1 h-12 sm:h-13 rounded-2xl text-xs sm:text-sm font-black text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5 pt-1">
                        {onEditar && (
                          <button
                            onClick={() => onEditar(sol)}
                            className="flex items-center justify-center gap-2 flex-1 h-12 sm:h-13 px-4 rounded-2xl border border-blue-200/90 bg-blue-50/80 text-blue-600 text-sm font-black hover:bg-blue-100 hover:border-blue-300 shadow-xs active:scale-[0.98] transition-all"
                          >
                            <IonIcon
                              icon={createOutline}
                              className="text-lg sm:text-xl shrink-0"
                            />
                            <span>Editar</span>
                          </button>
                        )}
                        <button
                          onClick={() => setCancelId(sol.numero)}
                          className="flex items-center justify-center gap-2 flex-1 h-12 sm:h-13 px-4 rounded-2xl border border-red-200/90 bg-red-50/80 text-red-500 text-sm font-black hover:bg-red-100 hover:border-red-300 shadow-xs active:scale-[0.98] transition-all"
                        >
                          <IonIcon
                            icon={closeCircleOutline}
                            className="text-lg sm:text-xl shrink-0"
                          />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
