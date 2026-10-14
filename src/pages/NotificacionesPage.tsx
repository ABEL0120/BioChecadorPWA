import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import {
  notificationsOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  restaurantOutline,
  logOutOutline,
  logInOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { SinSesionMensaje } from "../components/SinSesionMensaje";
import { useNotificaciones } from "../hooks/useNotificaciones";

const NotificacionesPage: React.FC = () => {
  const {
    user,
    loading,
    subscribing,
    activo,
    permiso,
    supported,
    handleActivar,
    handleDesactivar,
  } = useNotificaciones();

  return (
    <IonPage id="notificaciones-page" className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-1 sm:pl-2">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-900 text-base sm:text-lg">
            Recordatorios de Turno
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-xl mx-auto space-y-4 sm:space-y-6 py-1 sm:py-2">
          {!user ? (
            <SinSesionMensaje />
          ) : loading ? (
            <div className="flex justify-center p-12">
              <IonSpinner name="crescent" className="text-blue-600 w-8 h-8" />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        activo
                          ? "bg-emerald-600 text-white shadow-emerald-200"
                          : "bg-blue-600 text-white shadow-blue-200"
                      }`}
                    >
                      <IonIcon
                        icon={notificationsOutline}
                        className="text-xl sm:text-2xl"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                        Recordatorios
                      </h2>
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-0.5 truncate">
                        Alertas de horario en tu dispositivo
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 border shadow-sm shrink-0 ${
                      activo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                        activo ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {!supported && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="text-amber-600 text-lg sm:text-xl shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] sm:text-xs font-semibold text-amber-800 leading-relaxed m-0">
                      Tu dispositivo o navegador actual no soporta
                      notificaciones Web Push. Asegúrate de tener instalada la
                      PWA y utilizar un navegador compatible.
                    </p>
                  </div>
                )}

                {permiso === "denied" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="text-red-600 text-lg sm:text-xl shrink-0 mt-0.5"
                    />
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-bold text-red-900 leading-tight m-0">
                        Notificaciones desactivadas en tu dispositivo
                      </p>
                      <p className="text-[11px] sm:text-xs font-medium text-red-700 leading-relaxed m-0">
                        Para habilitarlas, ve a los ajustes de tu celular o
                        navegador (Información de la App / Configuración del
                        sitio) y activa los permisos de Notificaciones.
                      </p>
                      <div className="pt-2 border-t border-red-200/60">
                        <p className="text-[11px] sm:text-xs font-bold text-red-800 leading-snug m-0">
                          En Android: Tras activar o desactivar los permisos en
                          los ajustes, debes cerrar la app por completo de las
                          aplicaciones recientes (botarla) y volver a abrirla
                          para que el sistema actualice el estado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!user?.tieneBiometria && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                    <IonIcon
                      icon={alertCircleOutline}
                      className="text-amber-600 text-lg sm:text-xl shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-amber-900 leading-tight m-0">
                        Huella biométrica no registrada
                      </p>
                      <p className="text-[11px] sm:text-xs font-semibold text-amber-800 leading-relaxed mt-1 m-0">
                        Para activar y recibir recordatorios de turno, primero
                        debes registrar tu huella biométrica en la pantalla de
                        inicio.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Recibe notificaciones automáticas antes de tu hora de entrada,
                  salida/entrada a comer y salida de turno según tu horario
                  oficial.
                </p>

                <div className="pt-1 sm:pt-2">
                  {!activo ? (
                    <button
                      type="button"
                      disabled={
                        subscribing ||
                        !supported ||
                        permiso === "denied" ||
                        !user?.tieneBiometria
                      }
                      onClick={handleActivar}
                      className="w-full h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      {subscribing ? (
                        <IonSpinner
                          name="crescent"
                          className="w-5 h-5 text-white"
                        />
                      ) : (
                        <>
                          <IonIcon
                            icon={checkmarkCircleOutline}
                            className="text-lg sm:text-xl"
                          />
                          Activar Recordatorios
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={subscribing}
                      onClick={handleDesactivar}
                      className="w-full h-12 sm:h-14 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {subscribing ? (
                        <IonSpinner
                          name="crescent"
                          className="w-5 h-5 text-red-600"
                        />
                      ) : (
                        <>
                          <IonIcon
                            icon={closeCircleOutline}
                            className="text-lg sm:text-xl"
                          />
                          Cancelar Recordatorios
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-3 sm:space-y-4">
                <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
                  Eventos que se te recordarán
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <IonIcon
                        icon={logInOutline}
                        className="text-base sm:text-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-800 m-0 truncate">
                        Entrada de Turno
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 m-0 truncate">
                        Previo al inicio laboral
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <IonIcon
                        icon={restaurantOutline}
                        className="text-base sm:text-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-800 m-0 truncate">
                        Salida a Comer
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 m-0 truncate">
                        Previo al horario de comida
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon
                        icon={restaurantOutline}
                        className="text-base sm:text-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-800 m-0 truncate">
                        Regreso de Comer
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 m-0 truncate">
                        Previo al fin de comida
                      </p>
                    </div>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <IonIcon
                        icon={logOutOutline}
                        className="text-base sm:text-lg"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-800 m-0 truncate">
                        Salida de Turno
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 m-0 truncate">
                        Previo al fin de turno
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Las alertas se basan directamente en el horario oficial de
                  trabajo configurado en tu perfil de nómina.
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificacionesPage;
