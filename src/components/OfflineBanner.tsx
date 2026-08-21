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
    <div className="fixed top-0 left-0 w-full z-50 bg-amber-500 text-white text-center py-1.5 text-xs font-bold shadow-md flex items-center justify-center space-x-2">
      <IonIcon icon={cloudOfflineOutline} className="text-base" />
      <span>Modo sin conexión. Los marcajes se guardarán localmente.</span>
    </div>
  );
};
