import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { EstadoEmpleadoDto } from "../types/api";
import { checadorApi } from "../api/checadorApi";
import { biometricService } from "../services/biometricService";
import { offlineSyncService } from "../services/offlineSyncService";

export interface AuthSessionContextType {
  user: EstadoEmpleadoDto | null;
  login: (user: EstadoEmpleadoDto) => void;
  logout: () => void;
  refresh: () => Promise<{ success: boolean; message: string; }>;
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

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsedUser = JSON.parse(stored) as EstadoEmpleadoDto;
          setUser(parsedUser);

          if (navigator.onLine && parsedUser.rfc) {
            const deviceName = biometricService.getDeviceName();
            const res = await checadorApi.verificarRfc(
              parsedUser.rfc,
              deviceName,
            );
            if (res.success && res.data && res.data.existe) {
              setUser(res.data);
              localStorage.setItem(SESSION_KEY, JSON.stringify(res.data));
            } else if (!res.success) {
              logout();
            }
          }
        }
      } catch (err) {
        console.error("Error hydrating session:", err);
      } finally {
        setIsLoadingSession(false);
      }
    };

    hydrateSession();
  }, []);

  useEffect(() => {
    const syncOfflinePunches = async () => {
      if (!navigator.onLine) return;
      try {
        const pending = await offlineSyncService.obtenerChecadasPendientes();
        if (pending.length === 0) return;

        let syncedAny = false;
        for (const punch of pending) {
          try {
            const { id, timestamp, ...punchData } = punch;
            await checadorApi.marcar(punchData);
            if (id) {
              await offlineSyncService.eliminarChecada(id);
              syncedAny = true;
            }
          } catch (err: any) {
            console.error("Error syncing punch:", err);

            if (
              err.response &&
              err.response.status >= 400 &&
              err.response.status < 500
            ) {
              if (punch.id) await offlineSyncService.eliminarChecada(punch.id);
            }
          }
        }

        if (syncedAny) {
          refresh();
        }
      } catch (err) {
        console.error("Error syncing punches:", err);
      }
    };

    window.addEventListener("online", syncOfflinePunches);
    if (navigator.onLine) {
      syncOfflinePunches();
    }

    return () => {
      window.removeEventListener("online", syncOfflinePunches);
    };
  }, []);

  const login = (newUser: EstadoEmpleadoDto) => {
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async (): Promise<{ success: boolean; message: string }> => {
    if (isRefreshing) return { success: false, message: "Actualización en progreso..." };

    const stored = localStorage.getItem(SESSION_KEY);
    const currentUser = stored
      ? (JSON.parse(stored) as EstadoEmpleadoDto)
      : null;

    if (!currentUser?.rfc || !navigator.onLine) {
      return { success: false, message: "No se puede actualizar sin conexión o sin sesión." };
    }
    
    setIsRefreshing(true);
    try {
      const deviceName = biometricService.getDeviceName();
      const res = await checadorApi.verificarRfc(currentUser.rfc, deviceName);
      if (res.success && res.data && res.data.existe) {
        setUser(res.data);
        localStorage.setItem(SESSION_KEY, JSON.stringify(res.data));
        return { success: true, message: "Información actualizada correctamente." };
      } else if (!res.success) {
        logout();
        return { success: false, message: res.message || "Sesión expirada." };
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
      return { success: false, message: "Error de red al actualizar." };
    } finally {
      setIsRefreshing(false);
    }
    return { success: false, message: "Error desconocido." };
  };

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
