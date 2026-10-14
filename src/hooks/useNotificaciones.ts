import { useState, useEffect, useCallback, useRef } from "react";
import { useIonToast, useIonViewWillEnter } from "@ionic/react";
import { useAuthSession } from "../context/AuthSessionContext";
import { biometricService } from "../services/biometricService";
import {
  isPushSupported,
  getNotificationPermission,
  obtenerPermisoNotificacionesReal,
  isSubscribed,
  suscribirNotificaciones,
  desuscribirNotificaciones,
} from "../services/pushNotificationService";

export const useNotificaciones = () => {
  const { user } = useAuthSession();
  const [present] = useIonToast();

  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [activo, setActivo] = useState(false);
  const [permiso, setPermiso] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [supported, setSupported] = useState(true);

  const permisoRef = useRef<NotificationPermission | "unsupported">(permiso);
  useEffect(() => {
    permisoRef.current = permiso;
  }, [permiso]);

  const checkState = useCallback(async () => {
    try {
      const isSupp = isPushSupported();
      setSupported(isSupp);

      if (!isSupp) {
        setActivo(false);
        setPermiso("unsupported");
        setLoading(false);
        return;
      }

      const perm = await obtenerPermisoNotificacionesReal();
      setPermiso(perm);

      if (perm !== "granted") {
        setActivo(false);
        setLoading(false);
        return;
      }

      const sub = await isSubscribed();
      setActivo(sub);
      setLoading(false);

      if (user?.rfc && user?.tieneBiometria && isSupp && perm === "granted") {
        if (!sub) {
          const dispositivo = biometricService.getDeviceName();
          suscribirNotificaciones(user.rfc, dispositivo)
            .then(async (res) => {
              if (res.success) {
                setActivo(true);
                const updatedPerm = await obtenerPermisoNotificacionesReal();
                setPermiso(updatedPerm);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      setLoading(false);
    }
  }, [user?.rfc, user?.tieneBiometria]);

  useIonViewWillEnter(() => {
    checkState();
  });

  useEffect(() => {
    checkState();

    const handleRecheck = () => {
      checkState();
      setTimeout(checkState, 200);
      setTimeout(checkState, 500);
      setTimeout(checkState, 1000);
    };

    const handleSubChange = () => {
      checkState();
    };

    window.addEventListener("push_subscription_changed", handleSubChange);
    window.addEventListener("focus", handleRecheck);
    window.addEventListener("pageshow", handleRecheck);
    document.addEventListener("visibilitychange", handleRecheck);
    window.addEventListener("resume", handleRecheck);
    document.addEventListener("resume", handleRecheck);
    window.addEventListener("pointerdown", handleRecheck, { passive: true });

    let permStatus: PermissionStatus | null = null;
    if (
      typeof navigator !== "undefined" &&
      navigator.permissions &&
      navigator.permissions.query
    ) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          permStatus = status;
          permStatus.onchange = () => {
            handleRecheck();
          };
        })
        .catch(() => {});
    }

    const intervalId = setInterval(() => {
      checkState();
    }, 1500);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("push_subscription_changed", handleSubChange);
      window.removeEventListener("focus", handleRecheck);
      window.removeEventListener("pageshow", handleRecheck);
      document.removeEventListener("visibilitychange", handleRecheck);
      window.removeEventListener("resume", handleRecheck);
      document.removeEventListener("resume", handleRecheck);
      window.removeEventListener("pointerdown", handleRecheck);
      if (permStatus) {
        permStatus.onchange = null;
      }
    };
  }, [checkState]);


  const handleActivar = async () => {
    if (!user?.rfc) {
      present({
        message: "No se encontró RFC del empleado.",
        duration: 3500,
        color: "warning",
        position: "top",
      });
      return;
    }

    if (!user?.tieneBiometria) {
      present({
        message:
          "Primero debes registrar tu huella en el inicio para activar recordatorios.",
        duration: 3500,
        color: "warning",
        position: "top",
      });
      return;
    }

    setSubscribing(true);
    const dispositivo = biometricService.getDeviceName();
    const res = await suscribirNotificaciones(user.rfc, dispositivo);
    setSubscribing(false);

    if (res.success) {
      setActivo(true);
      const currentPerm = await obtenerPermisoNotificacionesReal();
      setPermiso(currentPerm);
      present({
        message: res.message,
        duration: 3500,
        color: "success",
        position: "top",
      });
    } else {
      const currentPerm = await obtenerPermisoNotificacionesReal();
      setPermiso(currentPerm);
      present({
        message: res.message,
        duration: 4000,
        color: "danger",
        position: "top",
      });
    }
  };

  const handleDesactivar = async () => {
    if (!user?.rfc) return;

    setSubscribing(true);
    const dispositivo = biometricService.getDeviceName();
    const res = await desuscribirNotificaciones(user.rfc, dispositivo);
    setSubscribing(false);

    if (res.success) {
      setActivo(false);
      present({
        message: res.message,
        duration: 3500,
        color: "medium",
        position: "top",
      });
    }
  };

  return {
    user,
    loading,
    subscribing,
    activo,
    permiso,
    supported,
    checkState,
    handleActivar,
    handleDesactivar,
  };
};
