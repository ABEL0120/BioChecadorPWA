import React, { useState, useEffect } from "react";
import {
  IonIcon,
  IonButton,
  IonSpinner,
  IonBadge,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  logInOutline,
  logOutOutline,
  warningOutline,
  lockClosedOutline,
  fingerPrintOutline,
  arrowForwardOutline,
  navigateOutline,
  timeOutline,
} from "ionicons/icons";
import { EstadoEmpleadoDto, RegistroChecadaResponseDto } from "../types/api";

import { timeService } from "../services/timeService";

interface Props {
  resultado: EstadoEmpleadoDto;
  enrolling: boolean;
  marking: boolean;
  siguienteMovimiento: string;
  formatMovementLabel: (mov?: string) => string;
  isValido: boolean;
  motivoBloqueo: string | null;
  mensajeAdvertencia: string | null;
  handleMarcarAsistencia: () => void;
  handleEnrolarBiometria: () => void;
  handleSolicitarReinicio: () => void;
  registroResult: RegistroChecadaResponseDto | null;
  showReenrollButton: boolean;
  hasPendingOffline: boolean;
  hasPendingSolicitud: boolean;
  toleranciaDeadline?: Date | null;
}

export const PanelMarcaje: React.FC<Props> = ({
  resultado,
  enrolling,
  marking,
  siguienteMovimiento,
  formatMovementLabel,
  isValido,
  motivoBloqueo,
  mensajeAdvertencia,
  handleMarcarAsistencia,
  handleEnrolarBiometria,
  handleSolicitarReinicio,
  registroResult,
  showReenrollButton,
  hasPendingOffline,
  hasPendingSolicitud,
  toleranciaDeadline,
}) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!toleranciaDeadline) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = timeService.now();
      const diffMs = toleranciaDeadline.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setTimeLeft(null);
      } else {
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [toleranciaDeadline]);

  return (
    <div className="space-y-5 pt-2">
      {resultado.tieneBiometria ? (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-5 relative overflow-hidden">
          {/* Fondo decorativo sutil */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center space-x-2 text-slate-800 font-black text-sm uppercase tracking-wide">
                <IonIcon icon={checkmarkCircleOutline} className="text-xl text-emerald-500" />
                <span>Siguiente Movimiento</span>
              </div>
              {timeLeft && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50/80 backdrop-blur-sm px-2.5 py-1 rounded-md w-fit border border-amber-200">
                  <IonIcon icon={timeOutline} className="text-sm" />
                  <span>Tolerancia restante: {timeLeft}</span>
                </div>
              )}
            </div>

            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center font-black text-xs text-slate-700 tracking-widest uppercase shadow-sm">
              <IonIcon
                icon={siguienteMovimiento === "ENTRADA" ? logInOutline : logOutOutline}
                className="mr-2 text-lg text-blue-600"
              />
              {formatMovementLabel(siguienteMovimiento)}
            </div>
          </div>

          {!isValido && motivoBloqueo && (
            <div className="flex items-start space-x-3 bg-red-50/80 text-red-700 p-3.5 rounded-2xl border border-red-200 backdrop-blur-sm relative z-10">
              <IonIcon icon={warningOutline} className="text-lg mt-0.5 shrink-0 text-red-500" />
              <span className="text-[11px] sm:text-xs font-bold leading-relaxed">{motivoBloqueo}</span>
            </div>
          )}

          {isValido && mensajeAdvertencia && (
            <div className="flex items-start space-x-3 bg-amber-50/80 text-amber-700 p-3.5 rounded-2xl border border-amber-200 backdrop-blur-sm relative z-10">
              <IonIcon icon={warningOutline} className="text-lg mt-0.5 shrink-0 text-amber-500" />
              <span className="text-[11px] sm:text-xs font-bold leading-relaxed">{mensajeAdvertencia}</span>
            </div>
          )}

          <button
            disabled={marking || hasPendingOffline || !isValido}
            onClick={handleMarcarAsistencia}
            className={`relative z-10 w-full h-14 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
              hasPendingOffline
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : !isValido
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98]"
            }`}
          >
            {marking ? (
              <IonSpinner name="crescent" className="w-5 h-5 text-current" />
            ) : hasPendingOffline ? (
              <>
                <IonIcon icon={logOutOutline} className="text-xl" />
                <span>Sincronización Pendiente</span>
              </>
            ) : !isValido ? (
              <>
                <IonIcon icon={lockClosedOutline} className="text-xl" />
                <span>Bloqueado</span>
              </>
            ) : (
              <>
                <IonIcon icon={fingerPrintOutline} className="text-xl" />
                <span>Marcar {formatMovementLabel(siguienteMovimiento)}</span>
              </>
            )}
          </button>

          <div className="relative z-10 flex justify-center mt-2">
            {showReenrollButton && !hasPendingSolicitud && (
              <button
                type="button"
                onClick={handleSolicitarReinicio}
                disabled={enrolling || marking}
                className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors py-1 bg-transparent border-none cursor-pointer underline"
              >
                {enrolling ? "Procesando..." : "Solicitar reinicio de Huella/Dispositivo"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          disabled={enrolling}
          onClick={handleEnrolarBiometria}
          className="w-full h-14 rounded-2xl font-bold tracking-wide transition-all duration-300 bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg hover:shadow-amber-200 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {enrolling ? (
            <IonSpinner name="crescent" className="w-5 h-5 text-white" />
          ) : (
            <>
              <IonIcon icon={fingerPrintOutline} className="text-xl" />
              <span>Capturar Huella / Face ID</span>
            </>
          )}
        </button>
      )}

      {registroResult && (
        <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 shadow-sm space-y-4 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200/50 pb-4 gap-3 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <IonIcon icon={navigateOutline} className="text-xl text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] sm:text-[11px] uppercase font-black text-blue-500 tracking-widest">
                  Marcaje Registrado
                </div>
                <div className="text-sm sm:text-base font-black text-slate-800 leading-tight mt-0.5">
                  {registroResult.nombre || resultado.nombre}
                </div>
              </div>
            </div>

            <IonBadge
              color={
                resultado.trabajoRemoto === "S"
                  ? "primary"
                  : registroResult.dentroDeRango
                  ? "success"
                  : "danger"
              }
              className="px-3.5 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-wider font-black rounded-xl self-start sm:self-auto shadow-sm"
            >
              {resultado.trabajoRemoto === "S"
                ? "Modalidad Home Office"
                : registroResult.dentroDeRango
                ? "Dentro de Sucursal"
                : "Fuera de Rango"}
            </IonBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
            <div className="bg-white/60 p-3 rounded-2xl border border-white">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold block mb-1">
                Distancia
              </span>
              <span className="text-sm font-mono font-black text-blue-600">
                {registroResult.distanciaMetros != null
                  ? registroResult.distanciaMetros >= 1000
                    ? `${Math.floor(registroResult.distanciaMetros / 1000)} Km ${Math.round(registroResult.distanciaMetros % 1000)} M`
                    : `${Math.round(registroResult.distanciaMetros)} M`
                  : "N/D"}
              </span>
            </div>
            <div className="bg-white/60 p-3 rounded-2xl border border-white">
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold block mb-1">
                Sucursal
              </span>
              <span className="text-xs font-bold text-slate-800 leading-tight block">
                {registroResult.empresa || resultado.razonSocial}
              </span>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-blue-800 font-semibold pt-2 relative z-10">
            {registroResult.mensaje}
          </div>
        </div>
      )}
    </div>
  );
};
