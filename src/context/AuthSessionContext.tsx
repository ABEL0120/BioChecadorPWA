import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { EstadoEmpleadoDto } from "../types/api";
import { checadorApi } from "../api/checadorApi";
import { biometricService } from "../services/biometricService";
import { offlineSyncService } from "../services/offlineSyncService";

export interface AuthSessionContextType {
  user: EstadoEmpleadoDto | null;
  login: (
    user:
      | Partial<EstadoEmpleadoDto>
      | ((prev: EstadoEmpleadoDto | null) => EstadoEmpleadoDto | null),
  ) => void;
  logout: () => void;
  refresh: () => Promise<{ success: boolean; message: string }>;
  isLoadingSession: boolean;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(
  undefined,
);
const SESSION_KEY = "reloj_nomina_session";

export const AuthSessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<EstadoEmpleadoDto | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("checador_cooldown_")) {
          sessionStorage.removeItem(key);
        }
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("checador_cooldown_")) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
  }, []);

  const syncOfflinePunches = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const pending = await offlineSyncService.obtenerChecadasPendientes();
      if (pending.length === 0) return;
      let syncedAny = false;
      for (const punch of pending) {
        try {
          const { id, timestamp, ...punchData } = punch;
          const res = await checadorApi.marcar(punchData);
          if (res.success || res.data) {
            if (id) await offlineSyncService.eliminarChecada(id);
            syncedAny = true;
          } else if (
            res.message &&
            (res.message.toLowerCase().includes("ya existe") ||
              res.message.toLowerCase().includes("ya se registr") ||
              res.message.toLowerCase().includes("ya tienes") ||
              res.message.toLowerCase().includes("no puedes registrar"))
          ) {
            if (id) await offlineSyncService.eliminarChecada(id);
            syncedAny = true;
          }
        } catch (err: any) {
          if (
            err.response &&
            err.response.status >= 400 &&
            err.response.status < 500
          ) {
            if (punch.id) await offlineSyncService.eliminarChecada(punch.id);
            syncedAny = true;
          }
        }
      }
      if (syncedAny) {
        window.dispatchEvent(new Event("offline-sync-completed"));
      }
    } catch (err) {}
  }, []);

  const refresh = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (
      isRefreshing ||
      sessionStorage.getItem("enrolling_biometric") === "true"
    ) {
      return { success: false, message: "Actualización en progreso..." };
    }
    const stored = localStorage.getItem(SESSION_KEY);
    const currentUser = stored
      ? (JSON.parse(stored) as EstadoEmpleadoDto)
      : null;
    if (!currentUser?.rfc || !navigator.onLine) {
      return {
        success: false,
        message: "No se puede actualizar sin conexión o sin sesión.",
      };
    }
    setIsRefreshing(true);
    try {
      await syncOfflinePunches();
      const deviceName = biometricService.getDeviceName();
      const res = await checadorApi.verificarRfc(currentUser.rfc, deviceName);
      if (res.success && res.data && res.data.existe) {
        setUser((prev) => {
          const freshData = res.data!;
          const tieneBio =
            sessionStorage.getItem("enrolling_biometric") === "true" ||
            prev?.tieneBiometria ||
            freshData.tieneBiometria;
          const userData = {
            ...freshData,
            tieneBiometria: tieneBio,
            fechaGuardadoLocal: new Date().toISOString().split("T")[0],
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
          return userData;
        });
        return {
          success: true,
          message: "Información actualizada correctamente.",
        };
      } else if (!res.success) {
        logout();
        return { success: false, message: res.message || "Sesión expirada." };
      }
    } catch (err) {
      return { success: false, message: "Error de red al actualizar." };
    } finally {
      setIsRefreshing(false);
    }
    return { success: false, message: "Error desconocido." };
  }, [isRefreshing, logout, syncOfflinePunches]);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setIsLoadingSession(false);
    }, 6000);
    const hydrateSession = async () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as EstadoEmpleadoDto;
          if (isMounted) {
            setUser(parsedUser);
            setIsLoadingSession(false);
          }
          if (navigator.onLine && parsedUser.rfc) {
            const deviceName = biometricService.getDeviceName();
            const res = await checadorApi.verificarRfc(
              parsedUser.rfc,
              deviceName,
            );
            if (isMounted) {
              if (res.success && res.data && res.data.existe) {
                const userData = {
                  ...res.data,
                  fechaGuardadoLocal: new Date().toISOString().split("T")[0],
                };
                setUser(userData);
                localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
              } else if (!res.success) {
                logout();
              }
            }
          }
        }
      } catch (err) {
      } finally {
        if (isMounted) setIsLoadingSession(false);
        clearTimeout(safetyTimeout);
      }
    };
    hydrateSession();
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [logout]);

  useEffect(() => {
    window.addEventListener("online", syncOfflinePunches);
    if (navigator.onLine) {
      syncOfflinePunches();
    }
    return () => {
      window.removeEventListener("online", syncOfflinePunches);
    };
  }, [syncOfflinePunches]);

  const login = (
    newUser:
      | Partial<EstadoEmpleadoDto>
      | ((prev: EstadoEmpleadoDto | null) => EstadoEmpleadoDto | null),
  ) => {
    setUser((prev) => {
      const stored = localStorage.getItem(SESSION_KEY);
      const currentStored = stored
        ? (JSON.parse(stored) as EstadoEmpleadoDto)
        : null;
      const base = prev || currentStored || ({} as EstadoEmpleadoDto);
      const resolved =
        typeof newUser === "function" ? newUser(base) : { ...base, ...newUser };
      if (!resolved) return null;
      const userData = {
        ...resolved,
        fechaGuardadoLocal: new Date().toISOString().split("T")[0],
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return userData;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        if (sessionStorage.getItem("enrolling_biometric") === "true") return;
        syncOfflinePunches().catch(() => {});
        refresh().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refresh, syncOfflinePunches]);

  return (
    <AuthSessionContext.Provider
      value={{ user, login, logout, refresh, isLoadingSession }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = (): AuthSessionContextType => {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error(
      "useAuthSession must be used within an AuthSessionProvider",
    );
  }
  return context;
};
