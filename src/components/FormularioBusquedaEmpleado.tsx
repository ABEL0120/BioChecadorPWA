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
    <form onSubmit={handleVerificarRfc} className="space-y-4 px-4 pb-4">
      <div className="flex flex-row gap-2 pt-4 items-center">
        <IonItem className="rounded-xl border border-slate-200 flex-1 bg-slate-50 ion-no-padding shadow-sm h-12 min-w-0">
          <IonIcon
            icon={personOutline}
            slot="start"
            className="text-slate-400 text-lg ml-3 mr-2"
          />
          <IonInput
            type="text"
            placeholder="RFC DEL EMPLEADO"
            value={rfc}
            onIonInput={(e) => setRfc(e.detail.value!)}
            className="font-mono uppercase font-black text-slate-800 text-sm"
            autocapitalize="characters"
            maxlength={13}
            clearInput
          />
        </IonItem>
        <IonButton
          type="submit"
          disabled={loading || rfc.trim().length < 10}
          className="h-12 w-14 sm:w-auto m-0 font-bold text-sm shadow-sm rounded-xl shrink-0 transition-all duration-300"
          color="primary"
        >
          {loading ? (
            <IonSpinner name="crescent" className="w-5 h-5" />
          ) : (
            <div className="flex items-center justify-center">
              <IonIcon
                icon={searchOutline}
                className="text-xl sm:text-base sm:pr-1"
              />
              <span className="hidden sm:inline">Verificar RFC</span>
            </div>
          )}
        </IonButton>
      </div>
    </form>
  );
};
