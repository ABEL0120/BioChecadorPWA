import React from "react";
import {
  IonAvatar,
  IonBadge,
  IonIcon,
  IonButton,
  IonSpinner,
} from "@ionic/react";
import {
  shieldCheckmarkOutline,
  alertCircleOutline,
  mapOutline,
  locateOutline,
  businessOutline,
} from "ionicons/icons";
import { EstadoEmpleadoDto } from "../types/api";
import { GpsLocationResult } from "../services/locationService";
import { GeofenceMap } from "./GeofenceMap";

interface Props {
  resultado: EstadoEmpleadoDto;
  userLocation: GpsLocationResult | null;
  fetchingGps: boolean;
  handleObtenerGpsMapa: () => void;
}

export const InfoEmpleado: React.FC<Props> = ({
  resultado,
  userLocation,
  fetchingGps,
  handleObtenerGpsMapa,
}) => {
  return (
    <div className="border-t-0 border border-slate-200 overflow-hidden bg-slate-50/50 space-y-4">
      <div className="p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <IonAvatar className="w-12 h-12 border-2 border-white/20 shadow-md">
            <div className="w-full h-full bg-blue-600 flex items-center justify-center font-black text-lg text-white">
              {(resultado.nombre || resultado.rfc || "NA")
                .substring(0, 2)
                .toUpperCase()}
            </div>
          </IonAvatar>

          <div>
            <h3 className="font-black text-base text-black leading-tight">
              {resultado.nombre || "Empleado Registrado"}
            </h3>
            <div className="font-mono text-xs text-black font-bold mt-0.5">
              RFC: {resultado.rfc}
            </div>
          </div>
        </div>

        <IonBadge
          color={resultado.tieneBiometria ? "success" : "warning"}
          className="px-3.5 py-2 text-xs font-bold rounded-xl self-start sm:self-auto flex items-center"
        >
          <IonIcon
            icon={
              resultado.tieneBiometria
                ? shieldCheckmarkOutline
                : alertCircleOutline
            }
            className="mr-1.5 text-base"
          />
          {resultado.tieneBiometria
            ? "Biometría Enrolada"
            : "Biometría Pendiente"}
        </IonBadge>
      </div>

      <div className="px-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
            <IonIcon icon={mapOutline} className="text-sm text-blue-600" />
            <span>Sucursal y Ubicación</span>
          </div>

          <IonButton
            fill="clear"
            size="small"
            disabled={fetchingGps}
            onClick={handleObtenerGpsMapa}
            className="font-bold text-xs"
          >
            {fetchingGps ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon slot="start" icon={locateOutline} className="text-sm"/>
                Actualizar GPS
              </>
            )}
          </IonButton>
        </div>

        <GeofenceMap
          empresaLat={resultado.latitudEmpresa || 0}
          empresaLng={resultado.longitudEmpresa || 0}
          radioMetros={resultado.radioToleranciaMetros || 150}
          userLat={userLocation?.latitud ?? null}
          userLng={userLocation?.longitud ?? null}
          razonSocial={
            resultado.razonSocial || `Sucursal #${resultado.numeroCompania}`
          }
          nombreEmpleado={resultado.nombre || resultado.rfc || ""}
        />
      </div>

      <div className="px-5 pb-5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 w-full">
          <div className="flex items-center text-xs font-black uppercase text-slate-400 tracking-wider">
            <IonIcon
              icon={businessOutline}
              className="mr-1.5 text-blue-600 text-base"
            />
            Sucursal Asignada
          </div>
          <div className="text-sm font-black text-slate-900">
            {resultado.razonSocial}
          </div>
        </div>
      </div>
    </div>
  );
};
