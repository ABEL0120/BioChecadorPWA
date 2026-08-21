import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonBadge,
  IonChip,
  IonAvatar,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonButtons,
} from "@ionic/react";
import {
  searchOutline,
  fingerPrintOutline,
  businessOutline,
  locationOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  personOutline,
  timeOutline,
  refreshOutline,
  arrowForwardOutline,
  radioOutline,
  checkmarkCircleOutline,
  navigateOutline,
  logInOutline,
  logOutOutline,
  mapOutline,
  locateOutline,
  cloudOfflineOutline,
} from "ionicons/icons";
import { checadorApi } from "../api/checadorApi";
import { EstadoEmpleadoDto, RegistroChecadaResponseDto } from "../types/api";
import { biometricService } from "../services/biometricService";
import {
  locationService,
  GpsLocationResult,
} from "../services/locationService";
import { GeofenceMap } from "../components/GeofenceMap";
import { useAuthSession } from "../context/AuthSessionContext";
import { offlineSyncService } from "../services/offlineSyncService";

export const Home: React.FC = () => {
  const [rfc, setRfc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [marking, setMarking] = useState<boolean>(false);
  const [fetchingGps, setFetchingGps] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<GpsLocationResult | null>(
    null,
  );

  const { user: resultado, login, logout, isLoadingSession } = useAuthSession();

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (resultado && resultado.existe) {
      watchIdRef.current = locationService.seguirUbicacionActual(
        (loc) => {
          setUserLocation(loc);
        },
        (err) => {
          console.error("Error watching GPS:", err);
        },
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
  
  const [tipoMovimiento, setTipoMovimiento] = useState<"ENTRADA" | "SALIDA">(
    "ENTRADA",
  );
  const [registroResult, setRegistroResult] =
    useState<RegistroChecadaResponseDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [toastState, setToastState] = useState<{
    show: boolean;
    message: string;
    color: string;
  }>({
    show: false,
    message: "",
    color: "danger",
  });
  const [hasPendingOffline, setHasPendingOffline] = useState<boolean>(false);

  useEffect(() => {
    const checkPending = async () => {
      if (resultado && !navigator.onLine) {
        try {
          const pending = await offlineSyncService.obtenerChecadasPendientes();
          setHasPendingOffline(pending.some((p) => p.rfc === resultado.rfc));
        } catch (e) {
          console.error(e);
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
    if (resultado) {
      if (resultado.ultimoMovimientoHoy === "ENTRADA") {
        setTipoMovimiento("SALIDA");
      } else {
        setTipoMovimiento("ENTRADA");
      }
    }
  }, [resultado?.ultimoMovimientoHoy]);

  useEffect(() => {
    biometricService.isPlatformAvailable().then((available) => {
      setBiometricAvailable(available);
    });

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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
      setToastState({
        show: true,
        message: err.message || "Error al obtener GPS.",
        color: "warning",
      });
    } finally {
      setFetchingGps(false);
    }
  };

  const handleVerificarRfc = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRfc = rfc.trim().toUpperCase();

    if (!cleanRfc) {
      setToastState({
        show: true,
        message: "Ingresa un RFC de 12 o 13 caracteres para consultar.",
        color: "warning",
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
        login(response.data);
        setToastState({
          show: true,
          message: response.message || "Empleado localizado.",
          color: "success",
        });

        locationService
          .obtenerUbicacionActual()
          .then((loc) => setUserLocation(loc))
          .catch(() => {});
      } else {
        setErrorMsg(response.message || "RFC no encontrado en el sistema.");
      }
    } catch (err: any) {
      const apiData = err?.response?.data;
      const msg =
        apiData?.message ||
        err?.message ||
        "Error al conectar con la API de BioChecador.";
      setErrorMsg(msg);
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
        resultado.nombre || "",
      );

      const response = await checadorApi.enrolar({
        rfc: resultado.rfc,
        credentialId: biometricData.credentialId,
        publicKey: biometricData.publicKey,
        dispositivo: biometricData.dispositivo,
        userAgent: biometricData.userAgent,
      });

      if (response.success || response.data) {
        login({
          ...resultado,
          tieneBiometria: true,
        });
        setToastState({
          show: true,
          message: "¡Biometría enrolada exitosamente en el sistema!",
          color: "success",
        });
      } else {
        setToastState({
          show: true,
          message: response.message || "No se pudo registrar la biometría.",
          color: "danger",
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error durante la captura biométrica.";
      setToastState({
        show: true,
        message: msg,
        color: "danger",
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
      setToastState({
        show: true,
        message: "Paso 1/2: Consultando señal GPS...",
        color: "primary",
      });
      const location = await locationService.obtenerUbicacionActual();
      setUserLocation(location);

      setToastState({
        show: true,
        message: "Paso 2/2: Verificando sensor biométrico...",
        color: "primary",
      });

      let credentialId = "BIOMETRICO_NATIVO";
      let dispositivo = "Dispositivo Móvil";

      if (biometricAvailable) {
        const authData = await biometricService.autenticarBiometriaNativa(
          resultado.rfc,
        );
        credentialId = authData.credentialId;
        dispositivo = authData.dispositivo;
      }

      if (!navigator.onLine) {
        await offlineSyncService.guardarChecadaLocal({
          rfc: resultado.rfc,
          credentialId,
          latitud: location.latitud,
          longitud: location.longitud,
          dispositivo,
          tipoMovimiento,
        });

        setRegistroResult({
          dentroDeRango: true,
          distanciaMetros: 0,
          fechaHora: new Date().toISOString(),
          mensaje: "Guardado localmente. Se sincronizará al conectarse a red.",
          nombre: resultado.nombre || resultado.rfc || "",
          rfc: resultado.rfc,
          empresa: resultado.razonSocial || "Tu Empresa",
        });
        setHasPendingOffline(true);
        setToastState({
          show: true,
          message: `Asistencia (${tipoMovimiento}) guardada localmente (Modo Offline).`,
          color: "primary",
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
        tipoMovimiento,
      });

      if (response.data) {
        setRegistroResult(response.data);
        setTipoMovimiento(tipoMovimiento === "ENTRADA" ? "SALIDA" : "ENTRADA");
        setToastState({
          show: true,
          message:
            response.message ||
            `¡Asistencia (${tipoMovimiento}) registrada exitosamente!`,
          color: response.data.dentroDeRango ? "success" : "warning",
        });
      } else {
        setToastState({
          show: true,
          message:
            response.message ||
            "No se pudo registrar el marcaje de asistencia.",
          color: "danger",
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Error al registrar marcaje de asistencia.";

      if (
        msg.includes("NotAllowedError") ||
        msg.includes("timed out or was not allowed") ||
        msg.includes("cancel")
      ) {
        setToastState({
          show: true,
          message: "Autenticación biométrica cancelada. Intenta nuevamente.",
          color: "warning",
        });
      } else if (
        msg.includes("No credential") ||
        msg.includes("authenticator")
      ) {
        login({ ...resultado, tieneBiometria: false });
        setToastState({
          show: true,
          message:
            "Credencial biométrica no encontrada. Vuelve a registrar tu huella/rostro.",
          color: "warning",
        });
      } else {
        setToastState({
          show: true,
          message: msg,
          color: "danger",
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
  };

  return (
    <IonPage className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mr-2">
              <IonIcon icon={shieldCheckmarkOutline} className="text-2xl" />
            </div>
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-900">
            BioChecador
          </IonTitle>
          {resultado && (
            <IonButtons slot="end" className="pr-2">
              <IonButton
                id="btn-cambiar-empleado"
                fill="clear"
                className="text-xs font-bold m-0 p-0"
              >
                Cambiar Empleado
              </IonButton>
              <IonAlert
                trigger="btn-cambiar-empleado"
                header="¿Cambiar Empleado?"
                message="Volverás a la pantalla de búsqueda de RFC. ¿Deseas continuar?"
                buttons={[
                  {
                    text: "Cancelar",
                    role: "cancel",
                  },
                  {
                    text: "Aceptar",
                    role: "confirm",
                    handler: () => {
                      logout();
                    },
                  },
                ]}
              />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="max-w-4xl mx-auto space-y-6 py-2">
          {isLoadingSession ? (
            <div className="flex justify-center p-10">
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 via-blue-600 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/15">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
                      <IonIcon
                        icon={radioOutline}
                        className="animate-pulse text-emerald-300 text-base"
                      />
                      <span>Asistencia Biométrica</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      Panel de Control
                    </h1>
                    <p className="text-blue-100 text-sm max-w-md">
                      Registro de Asistencia en tiempo real.
                    </p>
                  </div>

                  <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center space-x-3 self-start md:self-auto">
                    <IonIcon
                      icon={timeOutline}
                      className="text-2xl text-white"
                    />
                    <div>
                      <div className="text-[10px] uppercase font-extrabold tracking-wider text-blue-100">
                        Hora Servidor
                      </div>
                      <div className="text-lg font-mono font-bold text-white tracking-wider">
                        {currentTime || "00:00:00"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <IonCard className="m-0 rounded-3xl border border-slate-200 shadow-md bg-white overflow-hidden">
                <IonCardHeader className="bg-slate-50/80 border-b border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <IonCardTitle className="text-lg font-black text-slate-900">
                        Búsqueda y Verificación
                      </IonCardTitle>
                      <IonCardSubtitle className="text-xs text-slate-500 font-medium mt-0.5">
                        Introduce el RFC del colaborador para consultar datos de
                        sucursal
                      </IonCardSubtitle>
                    </div>
                  </div>
                </IonCardHeader>

                <IonCardContent className="p-5 bg-white">
                  <form onSubmit={handleVerificarRfc} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch pt-3">
                      <IonItem className="rounded-2xl border border-slate-300 flex-1 bg-white ion-no-padding px-3 shadow-inner">
                        <IonIcon
                          icon={personOutline}
                          slot="start"
                          className="text-slate-400 text-xl mr-2 pl-3"
                        />
                        <IonInput
                          value={rfc}
                          onIonInput={(e) => setRfc(e.detail.value!)}
                          placeholder="RFC DEL COLABORADOR"
                          maxlength={13}
                          className="font-mono uppercase font-black text-slate-900"
                        />
                      </IonItem>

                      <IonButton
                        type="submit"
                        disabled={loading || enrolling || marking}
                        className="h-14 font-extrabold text-base shadow-lg shadow-blue-500/25 rounded-2xl"
                        color="primary"
                      >
                        {loading ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          <>
                            <IonIcon
                              slot="start"
                              icon={searchOutline}
                              className="pr-2"
                            />
                            Verificar RFC
                          </>
                        )}
                      </IonButton>
                    </div>
                  </form>

                  <IonAlert
                    isOpen={!!errorMsg && !resultado}
                    onDidDismiss={() => setErrorMsg(null)}
                    header="Aviso del Sistema"
                    message={errorMsg || ""}
                    buttons={["Aceptar"]}
                  />

                  {resultado && (
                    <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm space-y-4">
                      <div className=" p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <IonAvatar className="w-12 h-12 border-2 border-white/20 shadow-md">
                            <div className="w-full h-full bg-blue-600 flex items-center justify-center font-black text-lg text-white">
                              {(resultado.nombre || resultado.rfc || "NA")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                          </IonAvatar>

                          <div>
                            <h3 className="font-black text-base text-black leading-tight">
                              {resultado.nombre || "Colaborador Registrado"}
                            </h3>
                            <div className="font-mono text-xs text-black font-bold mt-0.5">
                              RFC: {resultado.rfc}
                            </div>
                          </div>
                        </div>

                        <IonBadge
                          color={
                            resultado.tieneBiometria ? "success" : "warning"
                          }
                          className="px-3.5 py-2 text-xs font-bold rounded-xl self-start sm:self-auto flex items-center"
                        >
                          <IonIcon
                            icon={
                              resultado.tieneBiometria
                                ? shieldCheckmarkOutline
                                : alertCircleOutline
                            }
                            className="mr-1.5 text-base"
                          />
                          {resultado.tieneBiometria
                            ? "Biometría Enrolada"
                            : "Biometría Pendiente"}
                        </IonBadge>
                      </div>

                      <div className="px-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                            <IonIcon
                              icon={mapOutline}
                              className="text-xl text-blue-600"
                            />
                            <span>Sucursal y Ubicación</span>
                          </div>

                          <IonButton
                            fill="clear"
                            size="small"
                            disabled={fetchingGps}
                            onClick={handleObtenerGpsMapa}
                            className="font-bold text-xs"
                          >
                            {fetchingGps ? (
                              <IonSpinner name="crescent" />
                            ) : (
                              <>
                                <IonIcon slot="start" icon={locateOutline} />
                                Actualizar GPS
                              </>
                            )}
                          </IonButton>
                        </div>

                        <GeofenceMap
                          empresaLat={resultado.latitudEmpresa || 0}
                          empresaLng={resultado.longitudEmpresa || 0}
                          radioMetros={resultado.radioToleranciaMetros || 150}
                          userLat={userLocation?.latitud ?? null}
                          userLng={userLocation?.longitud ?? null}
                          razonSocial={
                            resultado.razonSocial ||
                            `Sucursal #${resultado.numeroCompania}`
                          }
                          nombreEmpleado={
                            resultado.nombre || resultado.rfc || ""
                          }
                        />
                      </div>

                      <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                          <div className="flex items-center text-xs font-black uppercase text-slate-400 tracking-wider">
                            <IonIcon
                              icon={businessOutline}
                              className="mr-1.5 text-blue-600 text-base"
                            />
                            Sucursal Asignada
                          </div>
                          <div className="text-base font-black text-slate-900">
                            {resultado.razonSocial ||
                              `Compañía #${resultado.numeroCompania}`}
                          </div>
                          {/* <div className="text-xs text-slate-500 font-mono font-bold">
                        ID Compañía: {resultado.numeroCompania}
                      </div> */}
                        </div>

                        {/* <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex items-center text-xs font-black uppercase text-slate-400 tracking-wider">
                        <IonIcon
                          icon={locationOutline}
                          className="mr-1.5 text-emerald-600 text-base"
                        />
                        Coordenadas y Perímetro
                      </div>
                      <div className="text-xs font-mono text-slate-900 font-black">
                        Lat: {resultado.latitudEmpresa ?? 0.0} | Lng:{" "}
                        {resultado.longitudEmpresa ?? 0.0}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        Tolerancia Haversine:{" "}
                        <span className="font-black text-slate-900">
                          {resultado.radioToleranciaMetros ?? 150}m
                        </span>
                      </div>
                    </div> */}
                      </div>

                      <div className="px-5 pb-5 space-y-4">
                        {resultado.tieneBiometria ? (
                          <div className="space-y-4 bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                                <IonIcon
                                  icon={checkmarkCircleOutline}
                                  className="text-2xl text-emerald-600"
                                />
                                <span>Estás por registrar tu:</span>
                              </div>

                              <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center justify-center font-black text-sm text-slate-700 tracking-widest uppercase">
                                <IonIcon
                                  icon={
                                    tipoMovimiento === "ENTRADA"
                                      ? logInOutline
                                      : logOutOutline
                                  }
                                  className="mr-2 text-lg text-blue-600"
                                />
                                {tipoMovimiento}
                              </div>
                            </div>

                            <IonButton
                              expand="block"
                              color={hasPendingOffline ? "medium" : "success"}
                              disabled={marking || hasPendingOffline}
                              onClick={handleMarcarAsistencia}
                              className="font-black text-base shadow-lg shadow-emerald-500/25 h-14 rounded-2xl"
                            >
                              {marking ? (
                                <IonSpinner name="crescent" />
                              ) : hasPendingOffline ? (
                                <>
                                  <IonIcon
                                    slot="start"
                                    icon={cloudOfflineOutline}
                                    className="text-xl pr-2"
                                  />
                                  Sincronización Pendiente
                                </>
                              ) : (
                                <>
                                  <IonIcon
                                    slot="start"
                                    icon={fingerPrintOutline}
                                    className="text-xl pr-2"
                                  />
                                  Marcar {tipoMovimiento}
                                  <IonIcon
                                    slot="end"
                                    icon={arrowForwardOutline}
                                  />
                                </>
                              )}
                            </IonButton>
                          </div>
                        ) : (
                          <IonButton
                            expand="block"
                            color="warning"
                            disabled={enrolling}
                            onClick={handleEnrolarBiometria}
                            className="font-black text-sm shadow-md shadow-amber-500/20 h-14 rounded-2xl"
                          >
                            {enrolling ? (
                              <IonSpinner name="crescent" />
                            ) : (
                              <>
                                <IonIcon
                                  slot="start"
                                  icon={fingerPrintOutline}
                                />
                                Capturar Huella / Face ID Nativo
                                <IonIcon
                                  slot="end"
                                  icon={arrowForwardOutline}
                                />
                              </>
                            )}
                          </IonButton>
                        )}

                        {registroResult && (
                          <div className="p-5 rounded-2xl text-black shadow-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                              <div className="flex items-center space-x-2">
                                <IonIcon
                                  icon={navigateOutline}
                                  className="text-2xl text-blue-400"
                                />
                                <div>
                                  <div className="text-xs uppercase font-bold text-black">
                                    Marcaje Registrado
                                  </div>
                                  <div className="text-base font-black text-black">
                                    {registroResult.nombre || resultado.nombre}
                                  </div>
                                </div>
                              </div>

                              <IonBadge
                                color={
                                  registroResult.dentroDeRango
                                    ? "success"
                                    : "danger"
                                }
                                className="px-3 py-1.5 text-xs font-black rounded-lg"
                              >
                                {registroResult.dentroDeRango
                                  ? "Dentro de Sucursal"
                                  : "Fuera de Rango"}
                              </IonBadge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-black font-bold block">
                                  Distancia Calculada:
                                </span>
                                <span className="text-sm font-mono font-black text-blue-600">
                                  {registroResult.distanciaMetros != null
                                    ? `${registroResult.distanciaMetros.toFixed(1)} Metros`
                                    : "N/D"}
                                </span>
                              </div>
                              <div>
                                <span className="text-black font-bold block">
                                  Empresa / Sucursal:
                                </span>
                                <span className="text-sm font-bold text-black">
                                  {registroResult.empresa ||
                                    resultado.razonSocial}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs text-black font-medium pt-2 border-t border-slate-800">
                              {registroResult.mensaje}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </>
          )}
        </div>

        <IonToast
          isOpen={toastState.show}
          onDidDismiss={() => setToastState({ ...toastState, show: false })}
          message={toastState.message}
          duration={4000}
          color={toastState.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
