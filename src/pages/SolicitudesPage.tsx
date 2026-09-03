import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonToast,
  useIonAlert,
} from "@ionic/react";
import { shieldCheckmarkOutline } from "ionicons/icons";
import { useAuthSession } from "../context/AuthSessionContext";
import { checadorApi } from "../api/checadorApi";
import { formatError } from "../utils/errorHandler";
import { biometricService } from "../services/biometricService";

const SolicitudesPage: React.FC = () => {
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const [motivoSolicitud, setMotivoSolicitud] = useState("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const [hasPending, setHasPending] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  React.useEffect(() => {
    const checkEstatus = async () => {
      if (!user || !user.rfc) return;
      setLoadingStatus(true);
      try {
        const resp = await checadorApi.consultarEstatusSolicitud(
          user.rfc,
          user.numeroCompania || 0,
        );
        setHasPending(!resp.success);
      } catch (err) {
        setHasPending(false);
      } finally {
        setLoadingStatus(false);
      }
    };
    checkEstatus();
  }, [user]);

  const enviarSolicitudReinicio = async () => {
    if (!motivoSolicitud.trim()) {
      presentToast({
        message: "Por favor, ingresa un motivo válido.",
        duration: 3000,
        color: "warning",
      });
      return;
    }
    if (!user || !user.rfc) return;

    setEnviandoSolicitud(true);
    try {
      const resp = await checadorApi.enviarSolicitud({
        rfc: user.rfc,
        numeroCompania: user.numeroCompania || 0,
        motivo: motivoSolicitud.trim(),
        tipoDispositivo: biometricService.getDeviceName(),
      });


      if (resp.success) {
        localStorage.setItem(
          `solicitud_pendiente_${user.rfc}`,
          Date.now().toString(),
        );
        setMotivoSolicitud("");
        setHasPending(true);
        presentAlert({
          header: "Solicitud Enviada",
          message:
            "Tu solicitud ha sido enviada al administrador. Una vez aprobada, podrás registrar tu nueva huella.",
          buttons: ["OK"],
        });
      } else {
        if (
          resp.message?.includes("Ya existe una solicitud pendiente") ||
          resp.message?.includes("Ya cuentas con una solicitud pendiente")
        ) {
          localStorage.setItem(
            `solicitud_pendiente_${user.rfc}`,
            Date.now().toString(),
          );
          setHasPending(true);
        }
        presentAlert({
          header: "Aviso",
          message: resp.message || "Ocurrió un error al enviar la solicitud.",
          buttons: ["OK"],
        });
      }
    } catch (err: any) {
      presentAlert({
        header: "Error",
        message: formatError(err, "Error al conectar con el servidor."),
        buttons: ["OK"],
      });
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  if (!user) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
          <IonToolbar style={{ "--background": "#ffffff" }}>
            <IonButtons slot="start" className="pl-2">
              <IonMenuButton />
            </IonButtons>
            <IonTitle className="font-black text-slate-900">
              Solicitudes
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent
          className="ion-padding"
          style={{ "--background": "#f8fafc" }}
        >
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 font-medium text-center">
              Debes identificarte con tu RFC en el Panel Principal para enviar
              solicitudes.
            </p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-2">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-900">
            Reinicio Biometría
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-md mx-auto pt-6 flex flex-col h-full">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-3">
            Solicitar Reinicio Biometrico
          </h2>

          {loadingStatus ? (
            <div className="flex flex-col items-center justify-center py-10">
              <IonSpinner name="crescent" className="mb-4" />
              <p className="text-slate-500 text-sm font-medium">
                Verificando estatus...
              </p>
            </div>
          ) : hasPending ? (
            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl mt-4">
              <p className="text-yellow-800 text-sm font-medium text-center leading-relaxed">
                Ya cuentas con una solicitud pendiente en revisión. Por favor,
                espera la respuesta del administrador.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                Si cambiaste de celular o tienes problemas con el sensor,
                ingresa el motivo para que un administrador autorice el registro
                de tu nuevo dispositivo.
              </p>

              <div className="flex-1 mb-8">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                  Motivo de la Solicitud
                </label>
                <textarea
                  value={motivoSolicitud}
                  onChange={(e) => setMotivoSolicitud(e.target.value)}
                  maxLength={150}
                  placeholder="Ej. Me robaron el celular y compré uno nuevo."
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none transition-all resize-none h-40 shadow-sm"
                ></textarea>
              </div>

              <div className="mt-auto pb-4">
                <IonButton
                  expand="block"
                  className="h-14 m-0 font-bold text-base shadow-sm rounded-xl"
                  onClick={enviarSolicitudReinicio}
                  disabled={enviandoSolicitud || !motivoSolicitud.trim()}
                >
                  {enviandoSolicitud ? (
                    <IonSpinner name="dots" />
                  ) : (
                    "Enviar Solicitud"
                  )}
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SolicitudesPage;
