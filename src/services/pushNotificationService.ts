import { apiClient } from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";

const DEFAULT_VAPID_PUBLIC_KEY =
  "BNpCRhlYVI1lQkMXCMlnZ3MTcvpDAiIn7p93jL3S4x8KePx0WrycJdblCUj6Y7tl0K5ectfm15btO_mNGBjt9AY";

const STORAGE_KEY = "reloj_nomina_push_config";

export interface PushConfigLocal {
  minutosAnticipacion: number;
  activo: boolean;
  desactivadoManualmente?: boolean;
  alertaDescartadaTimestamp?: number;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

export const getNotificationPermission = ():
  | NotificationPermission
  | "unsupported" => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
};

export const obtenerPermisoNotificacionesReal = async (
  forceNativeCheck: boolean = false,
): Promise<NotificationPermission | "unsupported"> => {
  if (!isPushSupported()) return "unsupported";

  if (
    forceNativeCheck &&
    typeof Notification !== "undefined" &&
    Notification.requestPermission
  ) {
    try {
      const live = await Notification.requestPermission();
      if (live) return live;
    } catch {}
  }

  let pushState: string | null = null;
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.pushManager && reg.pushManager.permissionState) {
        pushState = await reg.pushManager.permissionState({
          userVisibleOnly: true,
        });
      }
    }
  } catch {}

  let permQueryState: string | null = null;
  if (
    typeof navigator !== "undefined" &&
    navigator.permissions &&
    navigator.permissions.query
  ) {
    try {
      const q = await navigator.permissions.query({
        name: "notifications" as PermissionName,
      });
      permQueryState = q.state;
    } catch {}
  }

  const syncPerm =
    typeof Notification !== "undefined" ? Notification.permission : "default";

  if (
    pushState === "denied" ||
    permQueryState === "denied" ||
    syncPerm === "denied"
  ) {
    return "denied";
  }

  if (
    pushState === "prompt" ||
    permQueryState === "prompt" ||
    syncPerm === "default"
  ) {
    if (
      pushState !== "granted" &&
      permQueryState !== "granted" &&
      syncPerm !== "granted"
    ) {
      return "default";
    }
  }

  if (
    syncPerm === "granted" ||
    permQueryState === "granted" ||
    pushState === "granted"
  ) {
    return "granted";
  }

  return syncPerm;
};

export const getExistingSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
        ]);
        if (reg && reg.pushManager) {
          return await reg.pushManager.getSubscription();
        }
        const activeReg = await navigator.serviceWorker.getRegistration();
        if (activeReg && activeReg.pushManager) {
          return await activeReg.pushManager.getSubscription();
        }
      }
      return null;
    } catch {
      return null;
    }
  };

export const isSubscribed = async (): Promise<boolean> => {
  const perm = await obtenerPermisoNotificacionesReal();
  if (perm !== "granted") return false;
  const sub = await getExistingSubscription();
  return !!sub;
};

export const obtenerConfiguracionLocal = (): PushConfigLocal => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}
  return { minutosAnticipacion: 10, activo: false };
};

export const guardarConfiguracionLocal = (
  config: Partial<PushConfigLocal>,
): void => {
  try {
    const current = obtenerConfiguracionLocal();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...config }),
    );
  } catch {}
};

export const descartarAlertaNotificaciones = (): void => {
  guardarConfiguracionLocal({ alertaDescartadaTimestamp: Date.now() });
};

export const suscribirNotificaciones = async (
  rfc: string,
  dispositivo: string,
): Promise<{ success: boolean; message: string }> => {
  if (!isPushSupported()) {
    return {
      success: false,
      message: "Tu navegador o dispositivo no soporta notificaciones push.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      success: false,
      message: "No se otorgaron permisos de notificaciones.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    const publicKey =
      import.meta.env.VITE_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
    const convertedKey = urlBase64ToUint8Array(publicKey);

    // Si ya existe una suscripción (podría estar expirada o desincronizada con FCM), renovarla limpiamente
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (unsubErr) {
        console.warn("Aviso al renovar suscripción anterior:", unsubErr);
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource,
    });

    const payload = {
      rfc,
      dispositivo,
      subscriptionJson: JSON.stringify(subscription.toJSON()),
    };

    const res = await apiClient.post(
      API_ENDPOINTS.NOTIFICACIONES.SUSCRIBIR,
      payload,
    );

    guardarConfiguracionLocal({ activo: true, desactivadoManualmente: false });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("push_subscription_changed", {
          detail: { activo: true },
        }),
      );
    }

    return {
      success: res.data?.success ?? true,
      message: res.data?.message || "Recordatorios activados correctamente.",
    };
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Error al suscribir notificaciones.";
    return {
      success: false,
      message: errorMsg,
    };
  }
};

export const desuscribirNotificaciones = async (
  rfc: string,
  dispositivo: string,
): Promise<{ success: boolean; message: string }> => {
  if (!isPushSupported()) {
    return {
      success: false,
      message: "Push no soportado.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      try {
        await apiClient.post(API_ENDPOINTS.NOTIFICACIONES.DESUSCRIBIR, {
          rfc,
          dispositivo,
          endpoint,
        });
      } catch {}
    }

    guardarConfiguracionLocal({ activo: false, desactivadoManualmente: true });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("push_subscription_changed", {
          detail: { activo: false },
        }),
      );
    }

    return {
      success: true,
      message: "Recordatorios desactivados correctamente.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Error al desactivar notificaciones.",
    };
  }
};

export const probarNotificacionLocal = async (
  titulo: string = "Recordatorio de Asistencia",
  mensaje: string = "Recuerda registrar tu checada en los próximos minutos.",
): Promise<boolean> => {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(titulo, {
      body: mensaje,
      icon: "/pwa-192x192-v2.png",
      badge: "/pwa-192x192-v2.png",
      vibrate: [200, 100, 200],
      data: { url: "/home" },
      tag: "test-notification-" + Date.now(),
    } as any);
    return true;
  } catch {
    return false;
  }
};

export const probarNotificacionRemota = async (
  rfc: string,
  dispositivo: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await apiClient.post("/notificaciones/probar", {
      rfc,
      dispositivo,
    });
    return {
      success: res.data?.success ?? true,
      message: res.data?.message || "Notificación enviada correctamente.",
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Error al enviar notificación de prueba.",
    };
  }
};

export const verificarEstadoPushServidor = async (
  rfc: string,
  dispositivo: string,
): Promise<boolean> => {
  try {
    const res = await apiClient.get(API_ENDPOINTS.NOTIFICACIONES.ESTADO, {
      params: { rfc, dispositivo },
    });
    return res.data?.tieneSuscripcion === true;
  } catch {
    return false;
  }
};

