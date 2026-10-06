import React, { useState } from "react";
import { IonIcon, IonBadge } from "@ionic/react";
import {
  timeOutline,
  calendarOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";
import {
  TurnoDetalleDto,
  HistoricoAMNResponse,
  EstadoEmpleadoDto,
} from "../types/api";
import { GeofenceMap } from "./GeofenceMap";

export interface DayData {
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

export interface SemaforoUI {
  text: string;
  icon: string;
  bg: string;
  border: string;
  textCol: string;
}

interface DiaHistorialItemProps {
  dia: DayData;
  getSemaforoUI: (estado: DayData["estado"]) => SemaforoUI | null;
  formatDelay: (minutos: number) => string;
  user: EstadoEmpleadoDto | null;
}

export const DiaHistorialItem: React.FC<DiaHistorialItemProps> = ({
  dia,
  getSemaforoUI,
  formatDelay,
  user,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const ui = getSemaforoUI(dia.estado);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full box-border transition-all duration-300 floating-card mb-4">
      <div
        className="bg-slate-50/80 backdrop-blur-sm px-4 sm:px-5 py-4 flex justify-between items-center w-full box-border cursor-pointer hover:bg-slate-100/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
            <IonIcon icon={calendarOutline} className="text-blue-500 text-xs sm:text-sm" />
          </div>
          <span className="font-black text-slate-800 text-[12px] sm:text-[15px] capitalize tracking-wide leading-tight">
            {dia.fecha.toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {ui && (
            <div
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 flex-shrink-0 shadow-sm ${ui.bg} ${ui.border}`}
            >
              <IonIcon icon={ui.icon} className={`${ui.textCol} text-sm`} />
              <span
                className={`${ui.textCol} text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}
              >
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

      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded
            ? "max-h-[60vh] sm:max-h-[800px] opacity-100 overflow-y-auto"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
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
                      <IonIcon
                        icon={timeOutline}
                        className="text-slate-400 flex-shrink-0"
                      />
                      {dia.turno.entrada}
                    </p>
                  </div>
                  <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-100 flex flex-col justify-center min-w-0">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 truncate">
                      Desviación
                    </p>
                    <p
                      className={`font-mono font-black text-sm sm:text-base truncate ${
                        dia.minutosRetardo > 0
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
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
                    <div
                      key={ridx}
                      className="flex flex-col p-3 sm:p-4 rounded-2xl border border-slate-100 bg-white shadow-sm w-full box-border gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <IonBadge
                            color="primary"
                            className="px-2 py-1 sm:px-2.5 rounded-lg text-[10px] sm:text-[11px] shrink-0 font-bold tracking-wide shadow-sm"
                          >
                            {reg.tipoMovimiento
                              ? reg.tipoMovimiento
                                  .replace(/_/g, " ")
                                  .toLowerCase()
                                  .replace(/\b\w/g, (char) =>
                                    char.toUpperCase(),
                                  )
                              : ""}
                          </IonBadge>
                          <div className="font-mono font-black text-slate-700 text-[12px] sm:text-[15px] flex items-center gap-1.5 shrink-0">
                            <IonIcon
                              icon={timeOutline}
                              className="text-slate-400 shrink-0"
                            />
                            {new Date(reg.fechaHora).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 text-left sm:text-right bg-slate-50 px-2 py-1 rounded-md w-fit max-w-full truncate">
                          {reg.dispositivoNombre || "N/D"}
                        </div>
                      </div>

                      {expanded &&
                        user &&
                        user.latitudEmpresa != null &&
                        user.longitudEmpresa != null &&
                        reg.latitud != null &&
                        reg.longitud != null && (
                          <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 mt-1 relative">
                            <GeofenceMap
                              empresaLat={user.latitudEmpresa}
                              empresaLng={user.longitudEmpresa}
                              radioMetros={user.radioToleranciaMetros || 150}
                              userLat={reg.latitud}
                              userLng={reg.longitud}
                              razonSocial={user.razonSocial || ""}
                              nombreEmpleado={user.nombre || ""}
                            />
                          </div>
                        )}
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
