import React from "react";
import { IonIcon, IonSpinner } from "@ionic/react";
import {
  alertCircleOutline,
  warningOutline,
  lockClosedOutline,
  fingerPrintOutline,
} from "ionicons/icons";

interface InfoEmpleadoProps {
  currentTime: string;
  resultado: any;
  fetchingGps: boolean;
  isValido: boolean;
  motivoBloqueo: string | null;
  mensajeAdvertencia: string | null;
  registroResult: any | null;
  marking: boolean;
  hasPendingOffline: boolean;
  siguienteMovimiento: string;
  enrolling: boolean;
  handleMarcarAsistencia: () => void;
  handleEnrolarBiometria: () => void;
  formatMovementLabel: (mov?: string) => string;
}

export const InfoEmpleado: React.FC<InfoEmpleadoProps> = ({
  currentTime,
  resultado,
  fetchingGps,
  isValido,
  motivoBloqueo,
  mensajeAdvertencia,
  registroResult,
  marking,
  hasPendingOffline,
  siguienteMovimiento,
  enrolling,
  handleMarcarAsistencia,
  handleEnrolarBiometria,
  formatMovementLabel,
}) => {
  return (
    <div className="px-6 pt-6 flex flex-col gap-6 flex-1 pb-6 overflow-y-auto">
      <div className="text-center shrink-0">
        <div className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
          {currentTime || "00:00:00"}
        </div>
      </div>

      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
            {(resultado?.nombre || resultado?.rfc || "NA")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h3 className="font-black text-xs text-slate-800 leading-tight">
              {resultado?.nombre || "Empleado"}
            </h3>
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5">
              {resultado?.rfc}
            </span>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm border ${resultado?.tieneBiometria ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}
        >
          {!resultado?.tieneBiometria && (
            <IonIcon icon={alertCircleOutline} className="text-sm shrink-0" />
          )}
          <span>{resultado?.tieneBiometria ? "Biometría" : "Pendiente"}</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-[20px] p-5 border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden shrink-0">
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Sucursal Asignada
          </span>
          {fetchingGps && (
            <IonSpinner name="crescent" className="w-4 h-4 text-blue-500" />
          )}
        </div>
        <div className="text-[13px] font-black text-slate-800 leading-relaxed relative z-10">
          {resultado.razonSocial}
        </div>

        <div
          className={`text-[11px] font-black mt-1 flex items-center gap-1.5 relative z-10 ${isValido ? "text-emerald-600" : "text-red-500"}`}
        >
          {!isValido ? (
            <>
              <IonIcon icon={warningOutline} className="text-sm shrink-0" />
              <span>{motivoBloqueo || "Fuera del área permitida"}</span>
            </>
          ) : (
            <span>Dentro del área permitida</span>
          )}
        </div>
      </div>

      {mensajeAdvertencia && isValido && (
        <div className="bg-amber-50 rounded-[20px] p-4 border border-amber-200 flex items-start gap-2.5 text-amber-700">
          <IonIcon icon={warningOutline} className="text-lg shrink-0 mt-0.5" />
          <span className="text-xs font-bold leading-relaxed">
            {mensajeAdvertencia}
          </span>
        </div>
      )}

      {registroResult && (
        <div className="bg-blue-50 p-5 rounded-[20px] border border-blue-100 flex flex-col gap-2.5 relative z-10">
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px]">
            <span>Marcaje Exitoso</span>
          </div>
          <div className="text-[13px] font-black text-slate-800 leading-relaxed">
            {registroResult.mensaje}
          </div>
        </div>
      )}

      <div className="mt-auto shrink-0 pt-4">
        {resultado?.tieneBiometria ? (
          <button
            disabled={marking || hasPendingOffline || !isValido}
            onClick={handleMarcarAsistencia}
            className={`w-full h-16 rounded-[20px] font-black text-lg tracking-wide transition-all duration-300 flex items-center justify-center gap-3 ${
              hasPendingOffline
                ? "bg-slate-200 text-slate-500 border border-slate-300"
                : !isValido
                  ? "bg-slate-100 text-slate-400 border border-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200/50 active:scale-[0.98]"
            }`}
          >
            {marking ? (
              <IonSpinner name="crescent" className="w-6 h-6 text-current" />
            ) : !isValido ? (
              <>
                <IonIcon
                  icon={lockClosedOutline}
                  className="text-2xl shrink-0"
                />
                <span>Bloqueado</span>
              </>
            ) : (
              <>
                <IonIcon
                  icon={fingerPrintOutline}
                  className="text-2xl shrink-0"
                />
                <span>Marcar {formatMovementLabel(siguienteMovimiento)}</span>
              </>
            )}
          </button>
        ) : (
          <button
            disabled={enrolling}
            onClick={handleEnrolarBiometria}
            className="w-full h-16 rounded-[20px] font-black text-lg tracking-wide transition-all duration-300 bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-200/50 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {enrolling ? (
              <IonSpinner name="crescent" className="w-6 h-6 text-white" />
            ) : (
              <>
                <IonIcon
                  icon={fingerPrintOutline}
                  className="text-2xl shrink-0"
                />
                <span>Enrolar Huella</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
