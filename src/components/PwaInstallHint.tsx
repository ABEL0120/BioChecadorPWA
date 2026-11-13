import React from "react";
import { IonIcon } from "@ionic/react";
import {
  closeOutline,
  downloadOutline,
  laptopOutline,
  phonePortraitOutline,
} from "ionicons/icons";
import { usePwaInstall } from "../hooks/usePwaInstall";

interface PwaInstallHintProps {
  className?: string;
}

export const PwaInstallHint: React.FC<PwaInstallHintProps> = ({
  className = "",
}) => {
  const {
    isStandalone,
    platform,
    canPromptNatively,
    hintDismissed,
    openInstallModal,
    dismissHint,
  } = usePwaInstall();

  if (isStandalone || hintDismissed) {
    return null;
  }

  const deviceIcon =
    platform === "desktop" ? laptopOutline : phonePortraitOutline;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between gap-2.5 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
          <IonIcon icon={deviceIcon} className="text-lg" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-black text-slate-800 block leading-snug">
            Instala Reloj Nómina
          </span>
          <span className="text-[11px] font-medium text-slate-500 block leading-snug">
            Móvil o computadora (opcional)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={openInstallModal}
          className="min-h-10 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 active:scale-95"
        >
          <IonIcon icon={downloadOutline} className="text-sm shrink-0" />
          <span>{canPromptNatively ? "Instalar" : "Ver pasos"}</span>
        </button>

        <button
          type="button"
          onClick={dismissHint}
          aria-label="Ocultar aviso de instalación"
          className="w-9 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
        >
          <IonIcon icon={closeOutline} className="text-lg" />
        </button>
      </div>
    </div>
  );
};

