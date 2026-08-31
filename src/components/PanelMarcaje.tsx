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
    <div className="px-5 pb-5 space-y-4 pt-2">
      {resultado.tieneBiometria ? (
        <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs sm:text-sm">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="text-base text-emerald-600"
                />
                <span>Estás por registrar tu:</span>
              </div>
              {timeLeft && (
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-200">
                  <IonIcon icon={timeOutline} />
                  <span>Tolerancia restante: {timeLeft}</span>
                </div>
              )}
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-700 tracking-wider uppercase">
              <IonIcon
                icon={
                  siguienteMovimiento === "ENTRADA"
                    ? logInOutline
                    : logOutOutline
                }
                className="mr-1.5 text-base text-blue-600"
              />
              {formatMovementLabel(siguienteMovimiento)}
            </div>
          </div>

          {!isValido && motivoBloqueo && (
            <div className="flex items-start space-x-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
              <IonIcon
                icon={warningOutline}
                className="text-base mt-0.5 shrink-0"
              />
              <span className="text-[11px] sm:text-xs font-bold leading-relaxed">
                {motivoBloqueo}
              </span>
            </div>
          )}

          {isValido && mensajeAdvertencia && (
            <div className="flex items-start space-x-2 bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-200">
              <IonIcon
                icon={warningOutline}
                className="text-base mt-0.5 shrink-0"
              />
              <span className="text-[11px] sm:text-xs font-bold leading-relaxed">
                {mensajeAdvertencia}
              </span>
            </div>
          )}

          <IonButton
            expand="block"
            disabled={marking || hasPendingOffline || !isValido}
            onClick={handleMarcarAsistencia}
            className="h-12 m-0 font-bold text-sm shadow-sm rounded-xl"
            color={
              hasPendingOffline
                ? "medium"
                : isValido
                ? "success"
                : "light"
            }
          >
            {marking ? (
              <IonSpinner name="crescent" className="w-5 h-5" />
            ) : hasPendingOffline ? (
              <>
                <IonIcon
                  slot="start"
                  icon={logOutOutline}
                  className="text-base pr-1.5"
                />
                Sincronización Pendiente
              </>
            ) : !isValido ? (
              <>
                <IonIcon slot="start" icon={lockClosedOutline} className="text-base pr-1.5" />
                Bloqueado
              </>
            ) : (
              <>
                <IonIcon
                  slot="start"
                  icon={fingerPrintOutline}
                  className="text-base pr-1.5"
                />
                Marcar {formatMovementLabel(siguienteMovimiento)}
              </>
            )}
          </IonButton>

          <div className="mt-5">
          {showReenrollButton && !hasPendingSolicitud && (
            <button
              type="button"
              onClick={handleSolicitarReinicio}
              disabled={enrolling || marking}
              className="w-full text-center text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors py-1 bg-transparent border-none cursor-pointer underline"
            >
              {enrolling
                ? "Registrando..."
                : "Solicitar reinicio de Huella/Dispositivo"}
            </button>
          )}
          </div>
        </div>
      ) : (
        <IonButton
          expand="block"
          color="warning"
          disabled={enrolling}
          onClick={handleEnrolarBiometria}
          className="h-12 m-0 font-bold text-sm shadow-sm rounded-xl"
        >
          {enrolling ? (
            <IonSpinner name="crescent" className="w-5 h-5" />
          ) : (
            <>
              <IonIcon slot="start" icon={fingerPrintOutline} className="text-base pr-1.5" />
              Capturar Huella / Face ID Nativo
            </>
          )}
        </IonButton>
      )}

      {registroResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <div className="flex items-start sm:items-center space-x-3">
              <IonIcon
                icon={navigateOutline}
                className="text-2xl text-blue-500 mt-1 sm:mt-0"
              />
              <div className="flex-1">
                <div className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                  Marcaje Registrado
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 leading-tight mt-0.5">
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
              className="px-3 py-1.5 text-[10px] sm:text-xs font-black rounded-lg self-start sm:self-auto"
            >
              {resultado.trabajoRemoto === "S"
                ? "Modalidad Home Office"
                : registroResult.dentroDeRango
                ? "Dentro de Sucursal"
                : "Fuera de Rango"}
            </IonBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-bold block mb-0.5">
                Distancia Calculada:
              </span>
              <span className="text-sm font-mono font-black text-blue-600">
                {registroResult.distanciaMetros != null
                  ? registroResult.distanciaMetros >= 1000
                    ? `${Math.floor(registroResult.distanciaMetros / 1000)} Km ${Math.round(registroResult.distanciaMetros % 1000)} Metros`
                    : `${Math.round(registroResult.distanciaMetros)} Metros`
                  : "N/D"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-0.5">
                Empresa / Sucursal:
              </span>
              <span className="text-sm font-bold text-slate-900 leading-tight block">
                {registroResult.empresa || resultado.razonSocial}
              </span>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-600 font-medium pt-3 border-t border-slate-200">
            {registroResult.mensaje}
          </div>
        </div>
      )}
    </div>
  );
};
