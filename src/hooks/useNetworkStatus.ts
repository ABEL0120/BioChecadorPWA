import { useState, useEffect } from "react";

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const syncNetworkState = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", syncNetworkState);
    window.addEventListener("pageshow", syncNetworkState);
    document.addEventListener("visibilitychange", syncNetworkState);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", syncNetworkState);
      window.removeEventListener("pageshow", syncNetworkState);
      document.removeEventListener("visibilitychange", syncNetworkState);
    };
  }, []);

  return isOnline;
};

