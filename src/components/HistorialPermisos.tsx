import React, { useState, useMemo } from "react";
import { PermisoEmpleado } from "../services/permisosService";
import { IonIcon, IonSpinner, IonAlert } from "@ionic/react";
import {
  calendarOutline,
  timeOutline,
  trashOutline,
  createOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";

interface HistorialPermisosProps {
  permisos: PermisoEmpleado[];
  loading: boolean;
  onEditar?: (permiso: PermisoEmpleado) => void;
  onCancelar: (
    numero: number,
  ) => Promise<{ success: boolean; message: string }>;
}

export const HistorialPermisos: React.FC<HistorialPermisosProps> = ({
  permisos,
  loading,
  onEditar,
  onCancelar,
}) => {
  const [filtroEstatus, setFiltroEstatus] = useState<string>("TODOS");
  const [permisoACancelar, setPermisoACancelar] =
    useState<PermisoEmpleado | null>(null);
  const [loadingCancelar, setLoadingCancelar] = useState<boolean>(false);

  const permisosFiltrados = useMemo(() => {
    if (filtroEstatus === "TODOS") return permisos;
    return permisos.filter(
      (p) => (p.voBo || "").trim().toUpperCase() === filtroEstatus,
    );
  }, [permisos, filtroEstatus]);

  const getStatusBadge = (vobo: string) => {
    const v = (vobo || "").trim().toUpperCase();
    switch (v) {
      case "APROBADO":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black rounded-xl bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-200">
            <IonIcon icon={checkmarkCircleOutline} className="text-sm" />{" "}
            Aprobado
          </span>
        );
      case "NEGADO":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black rounded-xl bg-red-50 text-red-600 uppercase tracking-widest border border-red-200">
            <IonIcon icon={closeCircleOutline} className="text-sm" /> Negado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black rounded-xl bg-amber-50 text-amber-700 uppercase tracking-widest border border-amber-200">
            <IonIcon icon={alertCircleOutline} className="text-sm" /> Pendiente
          </span>
        );
    }
  };

  const handleConfirmarCancelacion = async () => {
    if (!permisoACancelar) return;
    setLoadingCancelar(true);
    await onCancelar(permisoACancelar.numero);
    setLoadingCancelar(false);
    setPermisoACancelar(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (!permisos || permisos.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
        <IonIcon
          icon={calendarOutline}
          className="text-5xl text-slate-300 mb-2"
        />
        <p className="text-sm font-bold text-slate-500">
          No tienes permisos registrados
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Crea una nueva solicitud en la pestaña de arriba
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 sm:mt-4 space-y-4">
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl relative w-full gap-1 shadow-xs">
        {["TODOS", "PENDIENTE", "APROBADO", "NEGADO"].map((status) => (
          <button
            key={status}
            onClick={() => setFiltroEstatus(status)}
            className={`flex-1 h-10 min-h-10 flex items-center justify-center px-1 text-[11px] font-black uppercase transition-all duration-200 rounded-xl outline-none shrink-0 truncate ${
              filtroEstatus === status
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {permisosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-sm font-bold text-slate-400">
            No hay permisos con el estatus seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 sm:space-y-4">
          {permisosFiltrados.map((p) => {
            const esPendiente =
              (p.voBo || "").trim().toUpperCase() === "PENDIENTE";

            return (
              <div
                key={p.numero}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase">
                      Folio #{p.numero}
                    </span>
                    <p className="text-xs text-slate-400 font-semibold">
                      Registrado: {p.fechaRegistro} {p.horaRegistro}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(p.voBo)}</div>
                </div>

                <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-100 mb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <IonIcon
                        icon={timeOutline}
                        className="text-blue-500 shrink-0"
                      />
                      <span className="truncate">
                        {p.fechaInicioPermiso} {p.horaIniciaPermiso}
                      </span>
                    </div>
                    <span className="text-slate-400 font-normal px-1">al</span>
                    <div className="truncate text-right">
                      {p.fechaFinalizaPermiso} {p.horaFinalizaPermiso}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-500">
                      Tiempo efectivo:
                    </span>
                    <span className="text-xs sm:text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                      {p.tiempoTexto || `${p.minutosTotalPermiso}m`}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Motivo
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80 break-words">
                    {p.motivoPermiso}
                  </p>
                </div>

                {!esPendiente && p.personalNombreVoBo && (
                  <p className="text-[11px] font-semibold text-slate-400 mb-2 truncate">
                    Revisó:{" "}
                    <span className="text-slate-600">
                      {p.personalNombreVoBo}
                    </span>
                  </p>
                )}

                {esPendiente && (
                  <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                    {onEditar && (
                      <button
                        onClick={() => onEditar(p)}
                        className="flex items-center justify-center gap-2 flex-1 h-11 sm:h-12 min-h-11 px-3 rounded-2xl border border-blue-200/90 bg-blue-50/80 text-blue-600 text-xs sm:text-sm font-black hover:bg-blue-100 hover:border-blue-300 shadow-xs active:scale-[0.98] transition-all shrink-0"
                      >
                        <IonIcon
                          icon={createOutline}
                          className="text-base sm:text-lg shrink-0"
                        />
                        <span>Editar</span>
                      </button>
                    )}
                    <button
                      onClick={() => setPermisoACancelar(p)}
                      className="flex items-center justify-center gap-2 flex-1 h-11 sm:h-12 min-h-11 px-3 rounded-2xl border border-red-200/90 bg-red-50/80 text-red-600 text-xs sm:text-sm font-black hover:bg-red-100 hover:border-red-300 shadow-xs active:scale-[0.98] transition-all shrink-0"
                    >
                      <IonIcon
                        icon={trashOutline}
                        className="text-base sm:text-lg shrink-0"
                      />
                      <span>Cancelar</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <IonAlert
        isOpen={!!permisoACancelar}
        header="Cancelar Permiso"
        message={`¿Estás seguro de que deseas cancelar el permiso con folio #${permisoACancelar?.numero}? Esta acción no se puede deshacer.`}
        buttons={[
          {
            text: "No, mantener",
            role: "cancel",
            handler: () => setPermisoACancelar(null),
          },
          {
            text: loadingCancelar ? "Cancelando..." : "Sí, cancelar",
            role: "destructive",
            handler: handleConfirmarCancelacion,
          },
        ]}
      />
    </div>
  );
};
