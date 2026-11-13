import React, { useState } from "react";
import { IonIcon, IonModal, IonSpinner } from "@ionic/react";
import {
  addCircleOutline,
  checkmarkCircleOutline,
  closeOutline,
  desktopOutline,
  downloadOutline,
  ellipsisVerticalOutline,
  laptopOutline,
  logoAndroid,
  logoApple,
  shareOutline,
  timeOutline,
} from "ionicons/icons";
import { PwaPlatform } from "../context/pwaInstallContextDef";
import { usePwaInstall } from "../hooks/usePwaInstall";

interface ModalInstalarAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalInstalarApp: React.FC<ModalInstalarAppProps> = ({
  isOpen,
  onClose,
}) => {
  const { platform, canPromptNatively, installSuccess, triggerNativeInstall } =
    usePwaInstall();

  const [selectedTab, setSelectedTab] = useState<PwaPlatform | null>(null);
  const [installing, setInstalling] = useState(false);

  const activeTab = selectedTab ?? platform;

  const handleClose = () => {
    setSelectedTab(null);
    onClose();
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await triggerNativeInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      className="reloj-install-modal"
    >
      <div className="h-full md:h-auto md:max-h-[92dvh] bg-slate-100 md:bg-white overflow-y-auto p-4 md:p-0 flex items-start md:block justify-center">
        <div className="w-full max-w-lg md:max-w-none mx-auto bg-white rounded-3xl md:rounded-none p-5 sm:p-6 shadow-xl md:shadow-none border border-slate-200 md:border-0 space-y-4 my-auto md:my-0">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <IonIcon icon={timeOutline} className="text-2xl" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight m-0">
                  Instalar Reloj Nómina
                </h2>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 m-0">
                  Opcional · Úsala en navegador o instálala como aplicación
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar guía de instalación"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 active:scale-95"
            >
              <IonIcon icon={closeOutline} className="text-xl" />
            </button>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed m-0">
              Puedes usar Reloj Nómina directamente desde tu navegador o
              instalarla en tu teléfono o computadora para acceder más rápido
              en ventana propia y recibir recordatorios.
            </p>

            {installSuccess ? (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3.5 py-2.5 text-xs font-bold">
                <IonIcon
                  icon={checkmarkCircleOutline}
                  className="text-lg text-emerald-600 shrink-0"
                />
                <span>
                  Aplicación instalada. Ya puedes abrir Reloj Nómina desde tu
                  pantalla de inicio o escritorio.
                </span>
              </div>
            ) : (
              canPromptNatively && (
                <button
                  type="button"
                  disabled={installing}
                  onClick={handleNativeInstall}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {installing ? (
                    <IonSpinner name="crescent" className="w-4 h-4 text-white" />
                  ) : (
                    <>
                      <IonIcon icon={downloadOutline} className="text-base shrink-0" />
                      <span>Instalar Aplicación Ahora</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedTab("android")}
                className={`min-h-10 px-2 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "android"
                    ? "bg-white text-blue-600 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IonIcon icon={logoAndroid} className="text-sm shrink-0" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("ios")}
                className={`min-h-10 px-2 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "ios"
                    ? "bg-white text-blue-600 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IonIcon icon={logoApple} className="text-sm shrink-0" />
                <span className="sm:hidden">iPhone</span>
                <span className="hidden sm:inline">iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab("desktop")}
                className={`min-h-10 px-2 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "desktop"
                    ? "bg-white text-blue-600 font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IonIcon icon={laptopOutline} className="text-sm shrink-0" />
                <span className="sm:hidden">PC / Mac</span>
                <span className="hidden sm:inline">Escritorio</span>
              </button>
            </div>

            {activeTab === "android" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-blue-700 pb-2 border-b border-slate-200">
                  <IonIcon icon={logoAndroid} className="text-base shrink-0" />
                  <span>Pasos en Android (Chrome o Edge)</span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="leading-relaxed">
                    Toca el menú de <strong>3 puntos (⋮)</strong>{" "}
                    <IonIcon
                      icon={ellipsisVerticalOutline}
                      className="text-slate-500 inline-block align-middle text-sm"
                    />{" "}
                    en la esquina superior derecha del navegador.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="leading-relaxed">
                    Selecciona <strong>"Instalar aplicación"</strong> o{" "}
                    <strong>"Agregar a la pantalla principal"</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="leading-relaxed">
                    Confirma en <strong>Instalar</strong> y abre Reloj Nómina
                    desde tu pantalla de inicio como cualquier app.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "ios" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-blue-700 pb-2 border-b border-slate-200">
                  <IonIcon icon={logoApple} className="text-base shrink-0" />
                  <span>Pasos en iPhone / iPad (Safari)</span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="leading-relaxed">
                    Abre esta página en el navegador <strong>Safari</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="leading-relaxed">
                    Toca el ícono <strong>Compartir</strong>{" "}
                    <IonIcon
                      icon={shareOutline}
                      className="text-blue-600 inline-block align-middle text-sm"
                    />{" "}
                    en la barra de Safari.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="leading-relaxed">
                    Elige <strong>"Agregar a inicio"</strong>{" "}
                    <IonIcon
                      icon={addCircleOutline}
                      className="text-blue-600 inline-block align-middle text-sm"
                    />{" "}
                    y pulsa <strong>Agregar</strong> en la esquina superior.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "desktop" && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-blue-700 pb-2 border-b border-slate-200">
                  <IonIcon
                    icon={desktopOutline}
                    className="text-base shrink-0"
                  />
                  <span>Pasos en Escritorio (Chrome o Edge)</span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="leading-relaxed">
                    En <strong>Google Chrome</strong> o{" "}
                    <strong>Microsoft Edge</strong>, haz clic en el ícono de{" "}
                    <strong>Instalar</strong>{" "}
                    <IonIcon
                      icon={downloadOutline}
                      className="text-blue-600 inline-block align-middle text-sm"
                    />{" "}
                    al extremo derecho de la barra de direcciones (o usa el
                    botón superior si aparece disponible).
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="leading-relaxed">
                    También puedes abrir el menú del navegador{" "}
                    <strong>(⋮ / ⋯)</strong> &rarr;{" "}
                    <strong>Guardar y compartir / Aplicaciones</strong> &rarr;{" "}
                    <strong>Instalar Reloj Nómina</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-black text-[11px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="leading-relaxed">
                    Confirma en <strong>Instalar</strong> para fijar Reloj
                    Nómina en tu escritorio, barra de tareas o Launchpad en
                    ventana dedicada.
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition-all active:scale-[0.98]"
          >
            Entendido, continuar
          </button>
        </div>
      </div>
    </IonModal>
  );
};

