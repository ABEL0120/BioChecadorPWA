import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonToast,
  IonAlert,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { 
  timeOutline, 
  alertCircleOutline, 
  lockClosedOutline, 
  fingerPrintOutline,
  warningOutline
} from "ionicons/icons";
import { useReloj } from "../hooks/useReloj";
import { FormularioBusquedaEmpleado } from "../components/FormularioBusquedaEmpleado";
import { GeofenceMap } from "../components/GeofenceMap";
import { InfoEmpleado } from "../components/InfoEmpleado";
import { useHome } from "../hooks/useHome";
import { useLocation } from "react-router-dom";

export const Home: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatMovementLabel = (mov?: string) => {
    if (!mov) return "CARGANDO...";
    if (mov === "SALIDA_COMIDA") return "SALIDA A COMER";
    if (mov === "ENTRADA_COMIDA") return "REGRESO DE COMER";
    return mov;
  };

  const {
    rfc,
    setRfc,
    loading,
    enrolling,
    marking,
    fetchingGps,
    userLocation,
    resultado,
    isLoadingSession,
    isValido,
    motivoBloqueo,
    mensajeAdvertencia,
    siguienteMovimiento,
    registroResult,
    errorMsg,
    setErrorMsg,
    toastState,
    setToastState,
    alertState,
    setAlertState,
    hasPendingOffline,
    handleVerificarRfc,
    handleEnrolarBiometria,
    handleMarcarAsistencia,
    enviarSolicitudReinicio,
    logout,
    showSolicitudModal,
    setShowSolicitudModal,
    motivoSolicitud,
    setMotivoSolicitud,
    enviandoSolicitud,
  } = useHome();

  const currentTime = useReloj();


  return (
    <IonPage className="bg-slate-50">
      <IonHeader className="ion-no-border">
        <IonToolbar
          className="bg-white border-b border-slate-100"
          style={{ "--background": "#ffffff" }}
        >
          <IonButtons slot="start" className="pl-1">
            <IonMenuButton style={{ color: "#1e293b" }} />
          </IonButtons>

          <IonTitle 
            className="font-black tracking-tight text-lg text-center pr-12"
            style={{ color: "#1e293b" }}
          >
            Reloj Nómina
          </IonTitle>
          
          {resultado && (
            <IonButtons slot="end" className="absolute right-2">
              <button
                id="btn-cambiar-empleado"
                className="text-[11px] font-black tracking-widest uppercase text-red-500 bg-red-50 border border-red-200 px-4 py-2 rounded-xl shadow-sm hover:bg-red-100 hover:text-red-600 transition-all active:scale-95"
              >
                Salir
              </button>
              <IonAlert
                trigger="btn-cambiar-empleado"
                header="¿Cambiar Empleado?"
                message="Volverás a la pantalla de búsqueda. ¿Deseas continuar?"
                buttons={[
                  { text: "Cancelar", role: "cancel" },
                  { text: "Aceptar", role: "confirm", handler: () => logout() },
                ]}
              />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={!resultado} className="bg-slate-50" style={{ "--background": "transparent" }}>
        {isLoadingSession ? (
          <div className="flex justify-center p-12">
            <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
          </div>
        ) : resultado ? (
          <div className={`absolute inset-0 flex ${isDesktop ? 'flex-row' : 'flex-col'} overflow-hidden bg-slate-100`}>
            <div className={`relative ${isDesktop ? 'flex-1 h-full' : 'h-[40vh]'} shrink-0`}>
              <GeofenceMap
                empresaLat={resultado.latitudEmpresa || 0}
                empresaLng={resultado.longitudEmpresa || 0}
                radioMetros={resultado.radioToleranciaMetros || 150}
                userLat={userLocation?.latitud ?? null}
                userLng={userLocation?.longitud ?? null}
                razonSocial={resultado.razonSocial || `Sucursal #${resultado.numeroCompania}`}
                nombreEmpleado={resultado.nombre || resultado.rfc || ""}
              />
            </div>

            <div className={`relative z-10 bg-white ${isDesktop ? 'w-[400px] h-full border-l border-slate-200 shadow-2xl' : 'flex-1 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] -mt-6'} flex flex-col shrink-0 overflow-hidden`}>
              <InfoEmpleado
                currentTime={currentTime}
                resultado={resultado}
                fetchingGps={fetchingGps}
                isValido={isValido}
                motivoBloqueo={motivoBloqueo}
                mensajeAdvertencia={mensajeAdvertencia}
                registroResult={registroResult}
                marking={marking}
                hasPendingOffline={hasPendingOffline}
                siguienteMovimiento={siguienteMovimiento}
                enrolling={enrolling}
                handleMarcarAsistencia={handleMarcarAsistencia}
                handleEnrolarBiometria={handleEnrolarBiometria}
                formatMovementLabel={formatMovementLabel}
              />
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-xl mx-auto pb-8 pt-8 px-4">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IonIcon icon={timeOutline} className="text-3xl" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                  Identifícate con tu RFC para acceder a tu panel de asistencia
                </p>
              </div>
              <FormularioBusquedaEmpleado
                rfc={rfc}
                setRfc={setRfc}
                loading={loading}
                handleVerificarRfc={handleVerificarRfc}
              />
            </div>
          </div>
        )}

        <IonAlert
          isOpen={!!errorMsg && !resultado}
          onDidDismiss={() => setErrorMsg(null)}
          header="Aviso del Sistema"
          message={errorMsg || ""}
          buttons={["Aceptar"]}
        />

        <IonAlert
          header={alertState.title}
          isOpen={alertState.show}
          onDidDismiss={() => setAlertState({ ...alertState, show: false })}
          message={alertState.message}
          buttons={["Aceptar"]}
        />

        <IonToast
          isOpen={toastState.show}
          onDidDismiss={() => setToastState({ ...toastState, show: false })}
          message={toastState.message}
          duration={4000}
          color={toastState.color}
          position="top"
        />

        <IonModal
          isOpen={showSolicitudModal}
          onDidDismiss={() => setShowSolicitudModal(false)}
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
                onClick={() => setShowSolicitudModal(false)}
                disabled={enviandoSolicitud}
              >
                Cancelar
              </IonButton>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Home;
