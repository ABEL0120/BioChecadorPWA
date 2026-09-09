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
        <IonHeader className="ion-no-border">
          <IonToolbar className="bg-white/80 backdrop-blur-lg border-b border-slate-100" style={{ "--background": "transparent" }}>
            <IonButtons slot="start" className="pl-1">
              <IonMenuButton className="text-slate-700" />
            </IonButtons>
            <IonTitle className="font-black text-slate-800 text-lg tracking-tight">
              Solicitudes
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-sm w-full mx-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <IonIcon icon={shieldCheckmarkOutline} className="text-slate-300 text-3xl" />
              </div>
              <p className="text-slate-600 font-bold leading-relaxed">
                Identifícate con tu RFC en el Panel Principal para enviar solicitudes.
              </p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white/80 backdrop-blur-lg border-b border-slate-100" style={{ "--background": "transparent" }}>
          <IonButtons slot="start" className="pl-1">
            <IonMenuButton className="text-slate-700" />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-800 text-lg">
            Reinicio Biometría
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-md mx-auto pt-4 flex flex-col h-full">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 -mt-10 -mr-10 pointer-events-none"></div>
            
            <h2 className="text-2xl font-black text-slate-800 text-center mb-2 relative z-10">
              Solicitar Reinicio
            </h2>

            {loadingStatus ? (
              <div className="flex flex-col items-center justify-center py-12 relative z-10">
                <IonSpinner name="crescent" className="mb-4 text-blue-500 w-8 h-8" />
                <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">
                  Verificando estatus...
                </p>
              </div>
            ) : hasPending ? (
              <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 p-6 rounded-2xl mt-6 relative z-10 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IonIcon icon={shieldCheckmarkOutline} className="text-amber-500 text-xl" />
                </div>
                <p className="text-amber-700 text-sm font-bold text-center leading-relaxed">
                  Ya cuentas con una solicitud pendiente en revisión. Por favor,
                  espera la respuesta del administrador.
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                <p className="text-[13px] text-slate-500 text-center mb-8 leading-relaxed font-medium">
                  Si cambiaste de celular o tienes problemas con el sensor,
                  ingresa el motivo para que un administrador autorice el registro
                  de tu nuevo dispositivo.
                </p>

                <div className="mb-8">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                    Motivo de la Solicitud
                  </label>
                  <textarea
                    value={motivoSolicitud}
                    onChange={(e) => setMotivoSolicitud(e.target.value)}
                    maxLength={150}
                    placeholder="Ej. Me robaron el celular y compré uno nuevo."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[13px] sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-40 shadow-sm"
                  ></textarea>
                  <div className="text-right mt-1.5 mr-1 text-[10px] font-bold text-slate-400">
                    {motivoSolicitud.length}/150
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={enviarSolicitudReinicio}
                    disabled={enviandoSolicitud || !motivoSolicitud.trim()}
                    className={`w-full h-14 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center shadow-sm ${
                      enviandoSolicitud || !motivoSolicitud.trim()
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
                    }`}
                  >
                    {enviandoSolicitud ? (
                      <IonSpinner name="dots" className="text-current" />
                    ) : (
                      "Enviar Solicitud"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SolicitudesPage;
