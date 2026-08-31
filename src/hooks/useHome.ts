import { useState, useEffect, useRef } from "react";
import { locationService, GpsLocationResult, getDistanceFromLatLonInMeters } from "../services/locationService";
import { biometricService } from "../services/biometricService";
import { offlineSyncService } from "../services/offlineSyncService";
import { timeService } from "../services/timeService";
import { checadorApi } from "../api/checadorApi";
import { useAuthSession } from "../context/AuthSessionContext";
import { useValidacionMarcaje } from "./useValidacionMarcaje";
import { formatError } from "../utils/errorHandler";
import { RegistroChecadaResponseDto } from "../types/api";

export const useHome = () => {
  const [rfc, setRfc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    offlineSyncService.obtenerConfiguracion<string>("last_rfc").then((savedRfc) => {
      if (savedRfc) {
        setRfc(savedRfc);
      }
    });
  }, []);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [marking, setMarking] = useState<boolean>(false);
  const [showReenrollButton, setShowReenrollButton] = useState<boolean>(false);
  const [fetchingGps, setFetchingGps] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<GpsLocationResult | null>(null);

  const { user: resultado, login, logout, refresh, isLoadingSession } = useAuthSession();

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (resultado && resultado.existe) {
      watchIdRef.current = locationService.seguirUbicacionActual(
        (loc) => {
          setUserLocation(loc);
        },
        (err) => {
        }
      );
    } else {
      if (watchIdRef.current !== null) {
        locationService.detenerSeguimiento(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current !== null) {
        locationService.detenerSeguimiento(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [resultado]);

  const {
    isValido,
    motivoBloqueo,
    mensajeAdvertencia,
    siguienteMovimiento,
    distanciaMetros,
    toleranciaDeadline,
  } = useValidacionMarcaje(resultado, userLocation);

  const [registroResult, setRegistroResult] = useState<RegistroChecadaResponseDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  
  const [toastState, setToastState] = useState<{
    show: boolean;
    message: string;
    color: string;
  }>({
    show: false,
    message: "",
    color: "danger",
  });
  
  const [alertState, setAlertState] = useState<{
    show: boolean;
    message: string;
    title: string;
  }>({
    show: false,
    message: "",
    title: "",
  });
  
  const [hasPendingOffline, setHasPendingOffline] = useState<boolean>(false);
  const [hasPendingSolicitud, setHasPendingSolicitud] = useState<boolean>(false);

  useEffect(() => {
    const checkPending = async () => {
      if (resultado && !navigator.onLine) {
        try {
          const pending = await offlineSyncService.obtenerChecadasPendientes();
          setHasPendingOffline(pending.some((p) => p.rfc === resultado.rfc));
        } catch (e) {
        }
      } else {
        setHasPendingOffline(false);
      }
    };

    checkPending();

    const handleOffline = () => checkPending();
    const handleOnline = () => setHasPendingOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [resultado]);

  useEffect(() => {
    biometricService.isPlatformAvailable().then((available) => {
      setBiometricAvailable(available);
    });
  }, []);

  useEffect(() => {
    let watchId: number | null = null;
    if (resultado && resultado.trabajoRemoto !== "S") {
      watchId = locationService.iniciarMonitoreoContinuoAntiTrampa((mensaje) => {
        setAlertState({
          show: true,
          title: "Bloqueo de Seguridad (Anti-Salto)",
          message: mensaje,
        });
        limpiarBusqueda();
      });
    }

    return () => {
      if (watchId !== null) {
        locationService.detenerMonitoreoAntiTrampa(watchId);
      }
    };
  }, [resultado]);

  const handleRefresh = (event: CustomEvent) => {
    biometricService.isPlatformAvailable().then((available) => {
      setBiometricAvailable(available);
      event.detail.complete();
    });
  };

  const handleObtenerGpsMapa = async () => {
    setFetchingGps(true);
    try {
      const loc = await locationService.obtenerUbicacionActual();
      setUserLocation(loc);
      setToastState({
        show: true,
        message: "Ubicación GPS actualizada en el mapa.",
        color: "success",
      });
    } catch (err: any) {
      setAlertState({
        show: true,
        message: formatError(err, "Error al obtener GPS."),
        title: "Error GPS",
      });
    } finally {
      setFetchingGps(false);
    }
  };

  const handleVerificarRfc = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRfc = rfc.trim().toUpperCase();

    if (!cleanRfc) {
      setAlertState({
        show: true,
        message: "Ingresa un RFC de 12 o 13 caracteres para consultar.",
        title: "Error",
      });
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setRegistroResult(null);

    try {
      const deviceName = biometricService.getDeviceName();
      const response = await checadorApi.verificarRfc(cleanRfc, deviceName);
      if (response.success && response.data && response.data.existe) {
        offlineSyncService.guardarConfiguracion("last_rfc", cleanRfc);
        
        // Revisar si ya mandó solicitud recientemente (24h)
        const pendingKey = `solicitud_pendiente_${cleanRfc}`;
        const savedTimestamp = localStorage.getItem(pendingKey);
        if (!response.data.tieneBiometria) {
          // Si ya no tiene biometría, significa que el admin la aprobó y lo borró
          localStorage.removeItem(pendingKey);
          setHasPendingSolicitud(false);
        } else if (savedTimestamp) {
          const timeElapsed = Date.now() - parseInt(savedTimestamp, 10);
          if (timeElapsed < 24 * 60 * 60 * 1000) {
            setHasPendingSolicitud(true);
          } else {
            localStorage.removeItem(pendingKey);
            setHasPendingSolicitud(false);
          }
        } else {
          setHasPendingSolicitud(false);
        }

        login(response.data);
        locationService
          .obtenerUbicacionActual()
          .then((loc) => setUserLocation(loc))
          .catch(() => {});
      } else {
        setErrorMsg(response.message || "RFC no encontrado en el sistema.");
      }
    } catch (err: any) {
      setErrorMsg(formatError(err, "Error al conectar con la API de Reloj Nomina."));
    } finally {
      setLoading(false);
    }
  };

  const handleEnrolarBiometria = async () => {
    if (!resultado || !resultado.rfc) return;

    setEnrolling(true);

    try {
      const biometricData = await biometricService.enrolarBiometriaNativa(
        resultado.rfc,
        resultado.nombre || ""
      );

      const response = await checadorApi.enrolar({
        rfc: resultado.rfc,
        credentialId: biometricData.credentialId,
        publicKey: biometricData.publicKey,
        dispositivo: biometricData.dispositivo,
        userAgent: biometricData.userAgent,
      });

      if (response.success) {
        login({ ...resultado, tieneBiometria: true });
        setShowReenrollButton(false);
        
        localStorage.removeItem(`solicitud_pendiente_${resultado.rfc}`);
        setHasPendingSolicitud(false);

        setAlertState({
          show: true,
          message: "Biometría registrada correctamente.",
          title: "Éxito",
        });
      } else {
        setAlertState({
          show: true,
          message: response.message || "No se pudo registrar la biometría.",
          title: "Error",
        });
      }
    } catch (err: any) {
      const msg = formatError(err, "Error durante la captura biométrica.");
      setAlertState({
        show: true,
        message: msg,
        title: "Error",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarcarAsistencia = async () => {
    if (!resultado || !resultado.rfc) return;

    setMarking(true);
    setRegistroResult(null);

    try {
      let location;
      if (resultado.trabajoRemoto === "S") {
        setToastState({
          show: true,
          message: "Paso 1/2: Obteniendo ubicación (Home Office)...",
          color: "primary",
        });
        const isWindows = /Windows/.test(navigator.userAgent);
        if (isWindows) {
          location = { latitud: 0, longitud: 0, accuracy: 0 };
        } else {
          location = await locationService.obtenerUbicacionActual();
        }
      } else {
        location = await locationService.obtenerUbicacionAntiTrampa((segs) => {
          setToastState({
            show: true,
            message: `Paso 1/2: Analizando integridad y señal GPS (${segs} seg)...`,
            color: "primary",
          });
        });
      }

      setUserLocation(location);

      setToastState({
        show: true,
        message: "Paso 2/2: Verificando sensor biométrico...",
        color: "primary",
      });

      let credentialId = "BIOMETRICO_NATIVO";
      let dispositivo = "Dispositivo Móvil";

      let canceladoPorSalto = false;
      let watchId: number | null = null;
      const isWindows = /Windows/.test(navigator.userAgent);
      
      if (navigator.geolocation && resultado.trabajoRemoto !== "S" && !isWindows) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const dist = getDistanceFromLatLonInMeters(
              location.latitud,
              location.longitud,
              pos.coords.latitude,
              pos.coords.longitude
            );
            if (dist > 500) {
              canceladoPorSalto = true;
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }

      if (biometricAvailable) {
        const authData = await biometricService.autenticarBiometriaNativa(
          resultado.rfc
        );
        credentialId = authData.credentialId;
        dispositivo = authData.dispositivo;
      }

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      if (canceladoPorSalto) {
        throw new Error(
          "Se detectó un cambio brusco de ubicación durante el escaneo biométrico (Posible Fake GPS rebotando). Intenta de nuevo."
        );
      }

      if (!navigator.onLine) {
        await offlineSyncService.guardarChecadaLocal({
          rfc: resultado.rfc,
          credentialId,
          latitud: location.latitud,
          longitud: location.longitud,
          dispositivo,
          tipoMovimiento: siguienteMovimiento,
        });

        setRegistroResult({
          dentroDeRango: true,
          distanciaMetros: 0,
          fechaHora: timeService.now().toISOString(),
          mensaje: "Guardado localmente. Se sincronizará al conectarse a red.",
          nombre: resultado.nombre || resultado.rfc || "",
          rfc: resultado.rfc,
          empresa: resultado.razonSocial || "Tu Empresa",
        });
        setHasPendingOffline(true);
        login({
          ...resultado,
          ultimoMovimientoHoy: siguienteMovimiento,
        });
        setAlertState({
          show: true,
          message: `Asistencia (${siguienteMovimiento}) guardada localmente (Modo Offline).`,
          title: "Éxito",
        });
        setMarking(false);
        return;
      }

      const response = await checadorApi.marcar({
        rfc: resultado.rfc,
        credentialId,
        latitud: location.latitud,
        longitud: location.longitud,
        dispositivo,
        tipoMovimiento: siguienteMovimiento,
      });

      if (response.data) {
        setRegistroResult(response.data);
        login({
          ...resultado,
          ultimoMovimientoHoy: siguienteMovimiento,
        });
        setAlertState({
          show: true,
          message:
            response.message ||
            `¡Asistencia (${siguienteMovimiento}) registrada exitosamente!`,
          title: (response.data.dentroDeRango || resultado.trabajoRemoto === "S") ? "Éxito" : "Fuera de Rango",
        });
      } else {
        setAlertState({
          show: true,
          message:
            response.message || "No se pudo registrar el marcaje de asistencia.",
          title: "Error",
        });
      }
    } catch (err: any) {
      const msg = formatError(err, "Error al registrar la asistencia.");
      const errorString = (
        String(err?.message || "") +
        " " +
        String(err?.name || "") +
        " " +
        String(err)
      ).toLowerCase();
      
      const msgLower = msg.toLowerCase();
      if (
        msgLower.includes("ya existe") || 
        msgLower.includes("ya hay") || 
        msgLower.includes("ya se registr") ||
        msgLower.includes("ya tienes una") || 
        msgLower.includes("no puedes registrar") ||
        msgLower.includes("ya registraste") ||
        msgLower.includes("tienes una") ||
        msgLower.includes("ya cuentas con") ||
        msgLower.includes("no se permite registrar")
      ) {
        refresh();
        setAlertState({
          show: true,
          message: msg + " La información de tu estado se ha sincronizado automáticamente.",
          title: "Aviso",
        });
        setMarking(false);
        return;
      }

      if (
        errorString.includes("notallowederror") ||
        errorString.includes("timed out or was not allowed") ||
        errorString.includes("cancel")
      ) {
        setShowReenrollButton(true);
        setAlertState({
          show: true,
          message: "Autenticación biométrica cancelada. Intenta nuevamente.",
          title: "Error",
        });
      } else if (
        errorString.includes("no credential") ||
        errorString.includes("authenticator")
      ) {
        login({ ...resultado, tieneBiometria: false });
        setAlertState({
          show: true,
          message:
            "Credencial biométrica no encontrada. Vuelve a registrar tu huella/rostro.",
          title: "Error",
        });
      } else {
        setAlertState({
          show: true,
          message: msg,
          title: "Error",
        });
      }
    } finally {
      setMarking(false);
    }
  };

  const limpiarBusqueda = () => {
    setRfc("");
    logout();
    setRegistroResult(null);
    setErrorMsg(null);
    setUserLocation(null);
    setShowReenrollButton(false);
  };
  
  const [showSolicitudModal, setShowSolicitudModal] = useState<boolean>(false);
  const [motivoSolicitud, setMotivoSolicitud] = useState<string>("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState<boolean>(false);

  const handleSolicitarReinicio = () => {
    setShowSolicitudModal(true);
  };

  const enviarSolicitudReinicio = async () => {
    if (!motivoSolicitud.trim()) {
      setToastState({
        show: true,
        message: "Por favor, ingresa un motivo válido.",
        color: "warning",
      });
      return;
    }
    if (!resultado || !resultado.rfc) return;

    setEnviandoSolicitud(true);
    try {
      const resp = await checadorApi.enviarSolicitud({
        rfc: resultado.rfc,
        numeroCompania: resultado.numeroCompania || 0,
        motivo: motivoSolicitud.trim(),
        tipoDispositivo: biometricService.getDeviceName(),
      });

      if (resp.success) {
        localStorage.setItem(`solicitud_pendiente_${resultado.rfc}`, Date.now().toString());
        setHasPendingSolicitud(true);
        setShowSolicitudModal(false);
        setMotivoSolicitud("");
        setAlertState({
          show: true,
          title: "Solicitud Enviada",
          message:
            "Tu solicitud ha sido enviada al administrador. Una vez aprobada, podrás registrar tu nueva huella.",
        });
      } else {
        if (resp.message?.includes("Ya existe una solicitud pendiente")) {
          localStorage.setItem(`solicitud_pendiente_${resultado.rfc}`, Date.now().toString());
          setHasPendingSolicitud(true);
        }
        setAlertState({
          show: true,
          title: "Error",
          message: resp.message || "Ocurrió un error al enviar la solicitud.",
        });
      }
    } catch (err: any) {
      setAlertState({
        show: true,
        title: "Error",
        message: formatError(err, "Error al conectar con el servidor."),
      });
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  return {
    rfc,
    setRfc,
    loading,
    enrolling,
    marking,
    showReenrollButton,
    fetchingGps,
    userLocation,
    resultado,
    isLoadingSession,
    isValido,
    motivoBloqueo,
    mensajeAdvertencia,
    siguienteMovimiento,
    distanciaMetros,
    toleranciaDeadline,
    registroResult,
    errorMsg,
    setErrorMsg,
    biometricAvailable,
    toastState,
    setToastState,
    alertState,
    setAlertState,
    hasPendingOffline,
    hasPendingSolicitud,
    showSolicitudModal,
    setShowSolicitudModal,
    motivoSolicitud,
    setMotivoSolicitud,
    enviandoSolicitud,
    handleRefresh,
    handleObtenerGpsMapa,
    handleVerificarRfc,
    handleEnrolarBiometria,
    handleMarcarAsistencia,
    handleSolicitarReinicio,
    enviarSolicitudReinicio,
    limpiarBusqueda,
    logout
  };
};
