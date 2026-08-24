import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/react";
import {
  downloadOutline,
  shieldCheckmarkOutline,
  shareOutline,
  addCircleOutline,
  logoAndroid,
  phonePortraitOutline,
  ellipsisVerticalOutline,
} from "ionicons/icons";

interface PwaInstallGateProps {
  children: React.ReactNode;
}

export const PwaInstallGate: React.FC<PwaInstallGateProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(ua);
    const iosCheck = /iPhone|iPad|iPod/i.test(ua);
    setIsMobile(mobileCheck);
    setIsIos(iosCheck);

    const checkStandalone = () => {
      const standaloneMatch = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const fullscreenMatch = window.matchMedia(
        "(display-mode: fullscreen)",
      ).matches;
      const minimalUiMatch = window.matchMedia(
        "(display-mode: minimal-ui)",
      ).matches;
      const navigatorStandalone = (navigator as any).standalone === true;
      const androidAppReferrer = document.referrer.includes("android-app://");
      const pwaParam =
        new URLSearchParams(window.location.search).get("mode") === "pwa";

      return (
        standaloneMatch ||
        fullscreenMatch ||
        minimalUiMatch ||
        navigatorStandalone ||
        androidAppReferrer ||
        pwaParam
      );
    };

    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleAceptarInstalar = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isMobile || isStandalone) {
    return <>{children}</>;
  }

  if (installSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto select-none text-center">
        <div className="max-w-sm w-full space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <IonIcon icon={shieldCheckmarkOutline} className="text-4xl" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">¡Instalación Iniciada!</h2>
            <p className="text-slate-400 text-sm font-medium px-4">
              La aplicación se está instalando. Por favor, cierra esta pestaña del navegador y abre la aplicación "Reloj Nomina" directamente desde tu pantalla de inicio o cajón de aplicaciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="max-w-sm w-full my-auto space-y-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/30">
            <IonIcon icon={shieldCheckmarkOutline} className="text-3xl" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reloj Nomina
          </h1>
          <IonBadge
            color="warning"
            className="px-3 py-1 font-bold text-xs rounded-full uppercase tracking-wider"
          >
            Instalación Obligatoria Requerida
          </IonBadge>
        </div>

        <IonCard className="m-0 rounded-3xl border border-slate-200 shadow-2xl bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-600 p-4 text-white">
            <h3 className="font-black text-base text-white text-center">
              Instala la Aplicación en tu Celular
            </h3>
          </div>

          <IonCardContent className="p-5 space-y-4">
            <div className="text-xs text-slate-600 text-center leading-relaxed font-medium">
              Por seguridad biométrica y geolocalización, debes instalar la app
              nativa en tu pantalla de inicio para acceder.
            </div>

            {isIos ? (
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
                <div className="text-[11px] font-black uppercase text-blue-600 tracking-wider flex items-center mb-1 pb-2">
                  <IonIcon
                    icon={phonePortraitOutline}
                    className="mr-1 text-xs"
                  />
                  Pasos para iPhone:
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>
                    Toca el botón <strong>Compartir</strong>{" "}
                    <IonIcon
                      icon={shareOutline}
                      style={{ width: "13px", height: "13px" }}
                      className="text-blue-600 inline-block align-middle"
                    />{" "}
                    en Safari.
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>
                    Selecciona <strong>"Agregar al inicio"</strong>{" "}
                    <IonIcon
                      icon={addCircleOutline}
                      style={{ width: "13px", height: "13px" }}
                      className="text-blue-600 inline-block align-middle"
                    />
                    .
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>Abre la app desde tu pantalla principal.</span>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-black uppercase text-emerald-600 tracking-wider flex items-center justify-center mb-2">
                  <IonIcon icon={logoAndroid} className="mr-1 text-sm" />
                  Instalación Android
                </div>
                <div className="p-2">
                  <IonButton
                    expand="block"
                    color="success"
                    className="font-black text-sm h-12 shadow-lg shadow-emerald-500/30 rounded-2xl m-0"
                    onClick={handleAceptarInstalar}
                  >
                    <IonIcon
                      slot="start"
                      icon={downloadOutline}
                      className="text-[23px] pr-2"
                    />
                    <div className="text-[12px] pt-1">Instalar App</div>
                  </IonButton>
                </div>
                <div className="text-center text-[10px] text-slate-500 font-medium px-2">
                  Toca el botón superior para instalar la aplicación
                  directamente en tu dispositivo sin salir de aquí.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
                <div className="text-[11px] font-black uppercase text-emerald-600 tracking-wider flex items-center mb-1">
                  <IonIcon icon={logoAndroid} className="mr-1 text-xs" />
                  Pasos para Android (WebAPK):
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <span>
                    Toca el menú de <strong>3 puntos (⋮)</strong>{" "}
                    <IonIcon
                      icon={ellipsisVerticalOutline}
                      style={{ width: "13px", height: "13px" }}
                      className="text-slate-600 inline-block align-middle"
                    />
                    .
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <span>
                    Selecciona <strong>"Instalar aplicación"</strong> (no
                    marcadores).
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <span>Abre la app instalada desde tu inicio.</span>
                </div>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default PwaInstallGate;
