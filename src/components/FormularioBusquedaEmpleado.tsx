import React from "react";
import { IonSpinner, IonIcon } from "@ionic/react";
import {
  searchOutline,
  personOutline,
  closeCircleOutline,
} from "ionicons/icons";

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
        <div className="w-full h-14 rounded-full shadow-xs border border-slate-200 bg-white hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all flex items-center px-4 gap-3">
          <IonIcon
            icon={personOutline}
            className="text-slate-400 text-xl shrink-0"
          />
          <input
            type="text"
            placeholder="Ingresa tu RFC"
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            className="w-full flex-1 bg-transparent border-none outline-none p-0 m-0 font-mono uppercase font-black text-slate-800 text-base tracking-widest placeholder:text-slate-400 placeholder:font-mono placeholder:tracking-widest leading-normal"
            autoCapitalize="characters"
            maxLength={13}
          />
          {rfc && (
            <button
              type="button"
              onClick={() => setRfc("")}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 shrink-0 flex items-center justify-center"
            >
              <IonIcon icon={closeCircleOutline} className="text-lg" />
            </button>
          )}
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
