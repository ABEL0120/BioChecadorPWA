import React from "react";
import {
  IonModal,
  IonButton,
  IonSpinner,
} from "@ionic/react";

interface SolicitudReinicioModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  motivoSolicitud: string;
  setMotivoSolicitud: (val: string) => void;
  enviarSolicitudReinicio: () => void;
  enviandoSolicitud: boolean;
}

export const SolicitudReinicioModal: React.FC<SolicitudReinicioModalProps> = ({
  isOpen,
  onDidDismiss,
  motivoSolicitud,
  setMotivoSolicitud,
  enviarSolicitudReinicio,
  enviandoSolicitud,
}) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
      className="bottom-modal"
    >
      <div className="p-6 bg-white h-full flex flex-col pt-6">
        <h2 className="text-xl font-black text-slate-900 text-center mb-2">
          Reinicio de Biometría
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          Si cambiaste de celular o tienes problemas con el sensor, ingresa
          el motivo para que un administrador autorice el registro de tu
          nuevo dispositivo.
        </p>

        <div className="flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
            Motivo de la Solicitud
          </label>
          <textarea
            value={motivoSolicitud}
            onChange={(e) => setMotivoSolicitud(e.target.value)}
            placeholder="Ej. Me robaron el celular y compré uno nuevo."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none h-32"
          ></textarea>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <IonButton
            expand="block"
            className="h-12 m-0 font-bold text-sm shadow-sm rounded-xl"
            onClick={enviarSolicitudReinicio}
            disabled={enviandoSolicitud || !motivoSolicitud.trim()}
          >
            {enviandoSolicitud ? (
              <IonSpinner name="dots" />
            ) : (
              "Enviar Solicitud"
            )}
          </IonButton>
          <IonButton
            expand="block"
            fill="clear"
            color="medium"
            className="h-12 m-0 font-bold text-sm"
            onClick={onDidDismiss}
            disabled={enviandoSolicitud}
          >
            Cancelar
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
};
