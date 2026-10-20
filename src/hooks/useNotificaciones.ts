import { useState, useCallback } from "react";
import { useIonToast, useIonViewWillEnter } from "@ionic/react";
import { useAuthSession } from "../context/AuthSessionContext";
import { biometricService } from "../services/biometricService";
import {
  isPushSupported,
  obtenerPermisoNotificacionesReal,
  isSubscribed,
  suscribirNotificaciones,
  desuscribirNotificaciones,
  verificarEstadoPushServidor,
  limpiarSuscripcionLocal,
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
      if (!sub) {
        setActivo(false);
        setLoading(false);
        return;
      }
      if (user?.rfc) {
        const deviceName = biometricService.getDeviceName();
        const tieneEnServidor = await verificarEstadoPushServidor(
          user.rfc,
          deviceName,
        );
        if (!tieneEnServidor) {
          await limpiarSuscripcionLocal().catch(() => {});
          setActivo(false);
          setLoading(false);
          return;
        }
      }
      setActivo(true);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [user?.rfc]);

  useIonViewWillEnter(() => {
    checkState();
  });

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
