import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonBadge,
  IonChip,
  IonAvatar,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonButtons,
  IonMenuToggle,
  IonMenu,
  IonMenuButton,
  IonModal,
} from "@ionic/react";
import {
  searchOutline,
  fingerPrintOutline,
  businessOutline,
  locationOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  personOutline,
  timeOutline,
  refreshOutline,
  arrowForwardOutline,
  radioOutline,
  checkmarkCircleOutline,
  navigateOutline,
  logInOutline,
  logOutOutline,
  mapOutline,
  locateOutline,
  cloudOfflineOutline,
} from "ionicons/icons";
import { checadorApi } from "../api/checadorApi";
import { EstadoEmpleadoDto, RegistroChecadaResponseDto } from "../types/api";
import { useReloj } from "../hooks/useReloj";
import { FormularioBusquedaEmpleado } from "../components/FormularioBusquedaEmpleado";
import { InfoEmpleado } from "../components/InfoEmpleado";
import { PanelMarcaje } from "../components/PanelMarcaje";
import { useHome } from "../hooks/useHome";
export const Home: React.FC = () => {
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
    showReenrollButton,
    fetchingGps,
    userLocation,
    resultado,
    isLoadingSession,
    isValido,
    motivoBloqueo,
    mensajeAdvertencia,
    siguienteMovimiento,
    distanciaMetros,
    toleranciaDeadline,
    registroResult,
    errorMsg,
    setErrorMsg,
    biometricAvailable,
    toastState,
    setToastState,
    alertState,
    setAlertState,
    hasPendingOffline,
    handleRefresh,
    handleObtenerGpsMapa,
    handleVerificarRfc,
    handleEnrolarBiometria,
    handleMarcarAsistencia,
    handleSolicitarReinicio,
    enviarSolicitudReinicio,
    limpiarBusqueda,
    logout,
    hasPendingSolicitud,
    showSolicitudModal,
    setShowSolicitudModal,
    motivoSolicitud,
    setMotivoSolicitud,
    enviandoSolicitud
  } = useHome();

  const currentTime = useReloj();

  return (
    <IonPage className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-2">
            <IonMenuButton />
          </IonButtons>

          <IonTitle className="font-black tracking-tight text-left text-slate-900 pl-15">
            Reloj Nomina Test
          </IonTitle>
          {resultado && (
            <IonButtons slot="end" className="pr-2">
              <IonButton
                id="btn-cambiar-empleado"
                fill="clear"
                className="text-xs font-bold m-0 p-0"
              >
                Cambiar Empleado
              </IonButton>
              <IonAlert
                trigger="btn-cambiar-empleado"
                header="¿Cambiar Empleado?"
                message="Volverás a la pantalla de búsqueda de RFC. ¿Deseas continuar?"
                buttons={[
                  {
                    text: "Cancelar",
                    role: "cancel",
                  },
                  {
                    text: "Aceptar",
                    role: "confirm",
                    handler: () => {
                      logout();
                    },
                  },
                ]}
              />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="max-w-4xl mx-auto space-y-6 py-2">
          {isLoadingSession ? (
            <div className="flex justify-center p-10">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-blue-600 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/15">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
                      <IonIcon
                        icon={radioOutline}
                        className="animate-pulse text-emerald-300 text-base"
                      />
                      <span>Asistencia Biométrica</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      Panel de Control
                    </h1>
                    <p className="text-blue-100 text-sm max-w-md">
                      Registro de Asistencia en tiempo real.
                    </p>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center space-x-3 self-start md:self-auto">
                    <IonIcon
                      icon={timeOutline}
                      className="text-2xl text-white"
                    />
                    <div>
                      <div className="text-[10px] uppercase font-extrabold tracking-wider text-blue-100">
                        Hora
                      </div>
                      <div className="text-lg font-mono font-bold text-white tracking-wider">
                        {currentTime || "00:00:00"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <IonCard className="m-0 rounded-3xl border border-slate-200 shadow-md bg-white overflow-hidden">
                {!resultado && (
                  <FormularioBusquedaEmpleado
                    rfc={rfc}
                    setRfc={setRfc}
                    loading={loading}
                    handleVerificarRfc={handleVerificarRfc}
                  />
                )}

                <IonCardContent
                  className={resultado ? "p-0 bg-white" : "p-5 bg-white"}
                >
                  <IonAlert
                    isOpen={!!errorMsg && !resultado}
                    onDidDismiss={() => setErrorMsg(null)}
                    header="Aviso del Sistema"
                    message={errorMsg || ""}
                    buttons={["Aceptar"]}
                  />

                  {resultado && (
                    <>
                      <InfoEmpleado
                        resultado={resultado}
                        userLocation={userLocation}
                        fetchingGps={fetchingGps}
                        handleObtenerGpsMapa={handleObtenerGpsMapa}
                      />
                      <PanelMarcaje
                        resultado={resultado}
                        enrolling={enrolling}
                        marking={marking}
                        siguienteMovimiento={siguienteMovimiento}
                        formatMovementLabel={formatMovementLabel}
                        isValido={isValido}
                        motivoBloqueo={motivoBloqueo}
                        mensajeAdvertencia={mensajeAdvertencia}
                        handleMarcarAsistencia={handleMarcarAsistencia}
                        handleEnrolarBiometria={handleEnrolarBiometria}
                        handleSolicitarReinicio={handleSolicitarReinicio}
                        registroResult={registroResult}
                        showReenrollButton={showReenrollButton}
                        hasPendingOffline={hasPendingOffline}
                        hasPendingSolicitud={hasPendingSolicitud}
                        toleranciaDeadline={toleranciaDeadline}
                      />
                    </>
                  )}
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>

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
          initialBreakpoint={0.75}
          breakpoints={[0, 0.75, 1]}
          className="bottom-modal"
        >
          <div className="p-6 bg-white h-full flex flex-col pt-10">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <IonIcon icon={shieldCheckmarkOutline} className="text-4xl text-blue-600 mb-3 mx-auto" />
            <h2 className="text-xl font-black text-slate-900 text-center mb-2">Reinicio de Biometría</h2>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              Si cambiaste de celular o tienes problemas con el sensor, ingresa el motivo para que un administrador autorice el registro de tu nuevo dispositivo.
            </p>
            
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                Motivo de la Solicitud
              </label>
              <textarea
                value={motivoSolicitud}
                onChange={(e) => setMotivoSolicitud(e.target.value)}
                placeholder="Ej. Me robaron el celular y compré uno nuevo."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none h-32"
              ></textarea>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <IonButton
                expand="block"
                className="h-12 m-0 font-bold text-sm shadow-sm rounded-xl"
                onClick={enviarSolicitudReinicio}
                disabled={enviandoSolicitud || !motivoSolicitud.trim()}
              >
                {enviandoSolicitud ? <IonSpinner name="dots" /> : "Enviar Solicitud"}
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
