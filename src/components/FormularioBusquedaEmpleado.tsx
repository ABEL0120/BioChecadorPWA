import React from "react";
import {
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import { searchOutline, personOutline } from "ionicons/icons";

interface Props {
  rfc: string;
  setRfc: (rfc: string) => void;
  loading: boolean;
  handleVerificarRfc: (e: React.FormEvent) => void;
}

export const FormularioBusquedaEmpleado: React.FC<Props> = ({
  rfc,
  setRfc,
  loading,
  handleVerificarRfc,
}) => {
  return (
    <form onSubmit={handleVerificarRfc} className="w-full">
      <div className="flex flex-col gap-4 items-center">
        <div className="w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <IonIcon icon={personOutline} className="text-slate-400 text-xl" />
          </div>
          <IonItem lines="none" className="squircle shadow-sm border border-slate-200 bg-white hover:border-blue-400 transition-colors w-full h-14" style={{ "--padding-start": "40px" }}>
            <IonInput
              type="text"
              placeholder="Ingresa tu RFC"
              value={rfc}
              onIonInput={(e) => setRfc(e.detail.value!)}
              className="font-mono uppercase font-black text-slate-800 text-[15px] tracking-widest"
              autocapitalize="characters"
              maxlength={13}
              clearInput
            />
          </IonItem>
        </div>
        <button
          type="submit"
          disabled={loading || rfc.trim().length < 10}
          className={`w-full h-14 rounded-2xl font-bold tracking-wide transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
            loading || rfc.trim().length < 10
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <IonSpinner name="crescent" className="w-5 h-5 text-white" />
          ) : (
            <>
              <IonIcon icon={searchOutline} className="text-xl" />
              <span>Verificar Identidad</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
