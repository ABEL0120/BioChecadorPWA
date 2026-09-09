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
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-6 overflow-y-auto select-none text-center">
        <div className="max-w-xs w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 space-y-6">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner shadow-emerald-500/20">
            <IonIcon icon={shieldCheckmarkOutline} className="text-5xl" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-wide">¡Instalación Iniciada!</h2>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
              La aplicación se está instalando. Por favor, cierra esta pestaña del navegador y abre la aplicación <strong>Reloj Nomina</strong> directamente desde tu pantalla de inicio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-6 overflow-y-auto select-none">
      <div className="max-w-sm w-full my-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/30 border-4 border-slate-800">
            <IonIcon icon={shieldCheckmarkOutline} className="text-4xl" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Reloj Nomina
          </h1>
          <IonBadge
            color="warning"
            className="px-4 py-1.5 font-black text-[10px] rounded-full uppercase tracking-widest shadow-sm"
          >
            Instalación Obligatoria
          </IonBadge>
        </div>

        <div className="rounded-3xl border border-slate-700 shadow-2xl bg-slate-800 overflow-hidden relative">
          <div className="bg-slate-800 p-6 space-y-5 relative z-10">
            <div className="text-sm text-slate-300 text-center leading-relaxed font-medium">
              Por seguridad biométrica y geolocalización, debes instalar la app
              nativa en tu pantalla de inicio para acceder.
            </div>

            {isIos ? (
              <div className="space-y-3 bg-slate-700/50 p-4 rounded-2xl border border-slate-600 text-[13px] text-slate-300 font-medium shadow-inner">
                <div className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center mb-2 pb-2 border-b border-slate-600">
                  <IonIcon icon={phonePortraitOutline} className="mr-1.5 text-sm" />
                  Pasos para iPhone
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Toca el botón <strong>Compartir</strong>{" "}
                    <IonIcon icon={shareOutline} className="text-blue-400 inline-block align-middle text-sm" />{" "}
                    en Safari.
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Selecciona <strong>"Agregar al inicio"</strong>{" "}
                    <IonIcon icon={addCircleOutline} className="text-blue-400 inline-block align-middle text-sm" />.
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Abre la app desde tu pantalla principal.</span>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4 bg-slate-700/50 p-5 rounded-2xl border border-slate-600 shadow-inner">
                <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center justify-center mb-1">
                  <IonIcon icon={logoAndroid} className="mr-1.5 text-sm" />
                  Instalación Android
                </div>
                <button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[13px] h-14 shadow-lg shadow-emerald-500/20 rounded-2xl transition-all flex items-center justify-center uppercase tracking-widest active:scale-95"
                  onClick={handleAceptarInstalar}
                >
                  <IonIcon icon={downloadOutline} className="text-lg mr-2" />
                  Instalar App
                </button>
                <div className="text-center text-[11px] text-slate-400 font-medium px-2 leading-relaxed">
                  Toca el botón superior para instalar la aplicación
                  directamente en tu dispositivo sin salir de aquí.
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-700/50 p-4 rounded-2xl border border-slate-600 text-[13px] text-slate-300 font-medium shadow-inner">
                <div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center mb-2 pb-2 border-b border-slate-600">
                  <IonIcon icon={logoAndroid} className="mr-1.5 text-sm" />
                  Pasos para Android (WebAPK)
                </div>

                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Toca el menú de <strong>3 puntos (⋮)</strong>{" "}
                    <IonIcon icon={ellipsisVerticalOutline} className="text-slate-400 inline-block align-middle text-sm" />.
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Selecciona <strong>"Instalar aplicación"</strong> (no
                    marcadores).
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Abre la app instalada desde tu inicio.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallGate;
