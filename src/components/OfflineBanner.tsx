import React, { useState, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import { cloudOfflineOutline } from "ionicons/icons";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 bg-amber-500/95 text-white py-1 px-4 text-[11px] font-bold rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none max-w-[85%] text-center justify-center border border-amber-400/80 backdrop-blur-sm select-none"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
    >
      <IonIcon icon={cloudOfflineOutline} className="text-sm shrink-0" />
      <span className="truncate">Modo sin conexión (guardado local)</span>
    </div>
  );
};
