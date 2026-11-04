import React from "react";
import { IonIcon } from "@ionic/react";
import { cloudOfflineOutline, wifiOutline } from "ionicons/icons";

interface ModuloSinConexionProps {
  modulo?: string;
  mensaje?: string;
}

export const ModuloSinConexion: React.FC<ModuloSinConexionProps> = ({
  modulo = "esta sección",
  mensaje = "Esta función requiere conexión a internet para consultar o enviar datos.",
}) => {
  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
        <IonIcon icon={cloudOfflineOutline} className="text-3xl" />
      </div>
      <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
        Sin Conexión a Internet
      </h3>
      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mb-6">
        {mensaje}
      </p>
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
        <IonIcon icon={wifiOutline} className="text-sm" />
        <span>Conéctate a una red para usar {modulo}</span>
      </div>
    </div>
  );
};
