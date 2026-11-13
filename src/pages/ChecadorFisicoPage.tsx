import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  IonIcon,
} from "@ionic/react";
import {
  qrCodeOutline,
  fingerPrintOutline,
  checkmarkCircle,
  alertCircle,
  restaurantOutline,
  logOutOutline,
  refreshOutline,
  homeOutline,
  timeOutline,
} from "ionicons/icons";
import { useLocation, useHistory } from "react-router-dom";
import { ChecadorFisicoScanner } from "../components/ChecadorFisicoScanner";
import { checadorApi } from "../api/checadorApi";
import { biometricService } from "../services/biometricService";
import { locationService } from "../services/locationService";
import { ChecadorFisicoResponseDto } from "../types/api";
import { useAuthSession } from "../context/AuthSessionContext";
import { extraerTokenChecadorFisico } from "../utils/checadorFisicoHelper";

type EstadoFlujo =
  | "SCANNING"
  | "AUTHENTICATING"
  | "PROCESSING"
  | "SELECTION"
  | "SUCCESS"
  | "ERROR";

export const ChecadorFisicoPage: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const { user, login } = useAuthSession();

  const [estado, setEstado] = useState<EstadoFlujo>("SCANNING");
  const [mensajeEstado, setMensajeEstado] = useState<string>("");
  const [tokenActual, setTokenActual] = useState<string>("");
  const [resultadoExitoso, setResultadoExitoso] =
    useState<ChecadorFisicoResponseDto | null>(null);
  const [opcionesSeleccion, setOpcionesSeleccion] = useState<string[]>([]);
  const [errorDetalle, setErrorDetalle] = useState<{
    titulo: string;
    mensaje: string;
    es401?: boolean;
  } | null>(null);

  const tokenProcesadoRef = useRef<boolean>(false);

  useEffect(() => {
    if (tokenProcesadoRef.current) return;
    const searchParams = new URLSearchParams(location.search);
    const tokenQuery =
      searchParams.get("tokenChecadorFisico") ||
      searchParams.get("token") ||
      searchParams.get("t") ||
      searchParams.get("code");

    if (tokenQuery) {
      tokenProcesadoRef.current = true;
      const limpio = extraerTokenChecadorFisico(tokenQuery);
      if (limpio) {
        ejecutarFlujo(limpio);
      }
    }
  }, [location.search]);

  const obtenerUbicacionFallback = async (): Promise<{
    latitud: number;
    longitud: number;
  }> => {
    try {
      const loc = await locationService.obtenerUbicacionActual();
      return { latitud: loc.latitud, longitud: loc.longitud };
    } catch {
      const conocida = locationService.getUltimaUbicacionConocida();
      if (conocida) {
        return { latitud: conocida.latitud, longitud: conocida.longitud };
      }
      return { latitud: 0, longitud: 0 };
    }
  };

  const ejecutarFlujo = async (
    token: string,
    tipoMovimientoOpcional?: "SALIDA_COMIDA" | "SALIDA" | null
  ) => {
    setTokenActual(token);
    setErrorDetalle(null);
    setResultadoExitoso(null);

    try {
      setEstado("AUTHENTICATING");
      setMensajeEstado("Verificando identidad con tu Passkey...");

      const passkey = await biometricService.obtenerAsercionChecadorFisico(
        token
      );

      setEstado("PROCESSING");
      setMensajeEstado("Registrando marcaje en el Checador Físico...");

      const ubicacion = await obtenerUbicacionFallback();
      const dispositivoNombre = biometricService.getDeviceName();

      const response = await checadorApi.marcarChecadorFisico({
        passkey,
        tokenChecadorFisico: token,
        tipoMovimientoOpcional: tipoMovimientoOpcional || null,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        dispositivoNombre,
      });

      if (!response.success && !response.data) {
        throw new Error(response.message || "Error al registrar en Checador Físico.");
      }

      const data = response.data;

      if (data?.requiereSeleccion) {
        setOpcionesSeleccion(
          data.opciones && data.opciones.length > 0
            ? data.opciones
            : ["SALIDA_COMIDA", "SALIDA"]
        );
        setEstado("SELECTION");
        return;
      }

      if (data) {
        setResultadoExitoso(data);
        if (user && data.rfc && user.rfc === data.rfc) {
          login({
            ultimoMovimientoHoy: data.tipoMovimiento,
            tieneSalidaHoy:
              data.tipoMovimiento === "SALIDA" ||
              data.tipoMovimiento?.includes("SALIDA"),
          });
        }
        setEstado("SUCCESS");
      } else {
        throw new Error(response.message || "No se recibieron datos de confirmación.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message || err?.message || "";

      if (status === 401) {
        setErrorDetalle({
          titulo: "Token expirado o Passkey no válida",
          mensaje:
            apiMsg ||
            "El código QR del Checador Físico ha caducado (duración 30s) o la Passkey no está vinculada. Por favor escanea el código nuevamente.",
          es401: true,
        });
        setEstado("ERROR");
        return;
      }

      if (status === 400) {
        setErrorDetalle({
          titulo: "Solicitud no válida",
          mensaje: apiMsg || "Parámetros de checada incorrectos o movimiento no permitido.",
          es401: false,
        });
        setEstado("ERROR");
        return;
      }

      if (err?.name === "NotAllowedError" || err?.name === "AbortError") {
        setErrorDetalle({
          titulo: "Autenticación cancelada",
          mensaje: "Cancelaste la verificación biométrica de la Passkey.",
          es401: false,
        });
        setEstado("ERROR");
        return;
      }

      setErrorDetalle({
        titulo: "Error al registrar",
        mensaje: apiMsg || "Ocurrió un error inesperado al procesar la checada.",
        es401: false,
      });
      setEstado("ERROR");
    }
  };

  const handleSeleccionarMovimiento = async (
    mov: "SALIDA_COMIDA" | "SALIDA"
  ) => {
    if (!tokenActual) {
      reiniciarFlujo();
      return;
    }
    await ejecutarFlujo(tokenActual, mov);
  };

  const reiniciarFlujo = () => {
    tokenProcesadoRef.current = false;
    setTokenActual("");
    setErrorDetalle(null);
    setResultadoExitoso(null);
    setOpcionesSeleccion([]);
    setEstado("SCANNING");
  };

  const formatearTipoMovimiento = (mov?: string) => {
    if (!mov) return "ASISTENCIA";
    if (mov === "ENTRADA") return "ENTRADA";
    if (mov === "SALIDA_COMIDA") return "SALIDA A COMER";
    if (mov === "ENTRADA_COMIDA") return "REGRESO DE COMER";
    if (mov === "SALIDA") return "SALIDA FINAL";
    return mov;
  };

  return (
    <IonPage className="bg-slate-50">
      <IonHeader className="ion-no-border">
        <IonToolbar
          className="bg-white border-b border-slate-100"
          style={{ "--background": "#ffffff" }}
        >
          <IonButtons slot="start" className="pl-1">
            <IonMenuButton style={{ color: "#1e293b" }} />
          </IonButtons>
          <IonTitle
            className="font-black tracking-tight text-lg text-slate-800"
            style={{ color: "#1e293b" }}
          >
            Checador Físico
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-md mx-auto flex flex-col items-center pt-2 pb-12">
          {estado === "SCANNING" && (
            <div className="w-full flex flex-col items-center gap-5">
              <div className="text-center px-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-xs">
                  <IonIcon icon={qrCodeOutline} className="text-2xl" />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">
                  Escaneo de Checador Físico
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Apunta tu cámara al código QR dinámico que aparece en la pantalla del checador físico.
                </p>
              </div>

              <ChecadorFisicoScanner
                onScanSuccess={(token) => ejecutarFlujo(token)}
              />

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-100 px-3.5 py-1.5 rounded-full mt-2">
                <IonIcon icon={fingerPrintOutline} className="text-sm text-slate-500" />
                <span>Autenticación rápida sin ingresar RFC</span>
              </div>
            </div>
          )}

          {(estado === "AUTHENTICATING" || estado === "PROCESSING") && (
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-blue-500/20 flex items-center justify-center shadow-lg">
                  {estado === "AUTHENTICATING" ? (
                    <IonIcon
                      icon={fingerPrintOutline}
                      className="text-5xl text-blue-600 animate-pulse"
                    />
                  ) : (
                    <IonSpinner
                      name="crescent"
                      className="w-12 h-12 text-blue-600"
                    />
                  )}
                </div>
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                {estado === "AUTHENTICATING"
                  ? "Verificando Passkey"
                  : "Registrando Asistencia"}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {mensajeEstado}
              </p>
            </div>
          )}

          {estado === "SELECTION" && (
            <div className="w-full flex flex-col items-center p-4">
              <div className="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
                  <IonIcon icon={timeOutline} className="text-3xl" />
                </div>

                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Selecciona tu Movimiento
                </h2>
                <p className="text-xs text-slate-500 mt-1 mb-6">
                  Ya cuentas con una entrada registrada hoy. Indica qué tipo de salida deseas checar:
                </p>

                <div className="w-full flex flex-col gap-3">
                  {opcionesSeleccion.includes("SALIDA_COMIDA") && (
                    <button
                      type="button"
                      onClick={() => handleSeleccionarMovimiento("SALIDA_COMIDA")}
                      className="w-full p-4 rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-400 active:scale-[0.98] transition-all flex items-center gap-4 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                        <IonIcon icon={restaurantOutline} className="text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 m-0 tracking-tight">
                          Salida a Comer
                        </h3>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                          Pausa intermedia para tomar alimentos
                        </p>
                      </div>
                    </button>
                  )}

                  {opcionesSeleccion.includes("SALIDA") && (
                    <button
                      type="button"
                      onClick={() => handleSeleccionarMovimiento("SALIDA")}
                      className="w-full p-4 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-400 active:scale-[0.98] transition-all flex items-center gap-4 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <IonIcon icon={logOutOutline} className="text-2xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-slate-900 m-0 tracking-tight">
                          Salida Final
                        </h3>
                        <p className="text-[11px] text-slate-500 m-0 mt-0.5">
                          Fin de la jornada laboral
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={reiniciarFlujo}
                  className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar y volver a escanear
                </button>
              </div>
            </div>
          )}

          {estado === "SUCCESS" && resultadoExitoso && (
            <div className="w-full flex flex-col items-center p-4">
              <div className="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 shadow-md ring-8 ring-emerald-50/50">
                  <IonIcon icon={checkmarkCircle} className="text-4xl" />
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                  Registro Confirmado
                </span>

                <h2 className="text-xl font-black text-slate-900 tracking-tight m-0">
                  {formatearTipoMovimiento(resultadoExitoso.tipoMovimiento)}
                </h2>

                <div className="w-full bg-slate-50 rounded-2xl p-4 my-6 flex flex-col gap-2.5 border border-slate-100 text-left">
                  {resultadoExitoso.rfc && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">RFC</span>
                      <span className="font-mono font-black text-slate-800 tracking-wider">
                        {resultadoExitoso.rfc}
                      </span>
                    </div>
                  )}

                  {resultadoExitoso.tipoMovimiento && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">Movimiento</span>
                      <span className="font-black text-blue-600">
                        {resultadoExitoso.tipoMovimiento}
                      </span>
                    </div>
                  )}

                  {resultadoExitoso.fechaHora && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-400">Fecha y Hora</span>
                      <span className="font-medium text-slate-700">
                        {resultadoExitoso.fechaHora}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={reiniciarFlujo}
                    className="w-full h-12 rounded-2xl bg-blue-600 text-white font-bold text-xs tracking-wide hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <IonIcon icon={qrCodeOutline} className="text-base" />
                    <span>Escanear Otro Código</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => history.push("/home")}
                    className="w-full h-12 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs tracking-wide hover:bg-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <IonIcon icon={homeOutline} className="text-base" />
                    <span>Volver al Inicio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {estado === "ERROR" && errorDetalle && (
            <div className="w-full flex flex-col items-center p-4">
              <div className="w-full bg-white rounded-3xl p-6 shadow-xl border border-red-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4 shadow-md ring-8 ring-red-50/50">
                  <IonIcon icon={alertCircle} className="text-4xl" />
                </div>

                <h2 className="text-lg font-black text-slate-900 tracking-tight m-0">
                  {errorDetalle.titulo}
                </h2>
                <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed max-w-xs">
                  {errorDetalle.mensaje}
                </p>

                <div className="w-full flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={reiniciarFlujo}
                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold text-xs tracking-wide hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <IonIcon icon={refreshOutline} className="text-base" />
                    <span>Volver a Escanear QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => history.push("/home")}
                    className="w-full h-12 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs tracking-wide hover:bg-slate-200 active:scale-[0.98] transition-all"
                  >
                    Ir al Inicio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChecadorFisicoPage;

