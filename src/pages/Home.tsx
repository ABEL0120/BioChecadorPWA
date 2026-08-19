import React, { useState, useEffect } from "react";
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
} from "ionicons/icons";
import { checadorApi } from "../api/checadorApi";
import { EstadoEmpleadoDto } from "../types/api";
import { biometricService } from "../services/biometricService";

export const Home: React.FC = () => {
  const [rfc, setRfc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resultado, setResultado] = useState<EstadoEmpleadoDto | null>(null);
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
    setResultado(null);

    try {
      const response = await checadorApi.verificarRfc(cleanRfc);
      if (response.data) {
        setResultado(response.data);
        setToastState({
          show: true,
          message: response.message || "Empleado localizado.",
          color: "success",
        });
      } else {
        setErrorMsg(response.message || "RFC no encontrado en el sistema.");
        setToastState({
          show: true,
          message: response.message || "Empleado no registrado.",
          color: "warning",
        });
      }
    } catch (err: any) {
      const apiData = err?.response?.data;
      if (apiData && apiData.data) {
        setResultado(apiData.data);
        setErrorMsg(apiData.message || "Empleado no registrado en el sistema.");
        setToastState({
          show: true,
          message: apiData.message || "Empleado no encontrado.",
          color: "warning",
        });
      } else {
        const msg =
          apiData?.message ||
          err?.message ||
          "Error al conectar con la API de BioChecador.";
        setErrorMsg(msg);
        setToastState({
          show: true,
          message: msg,
          color: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const limpiarBusqueda = () => {
    setRfc("");
    setResultado(null);
    setErrorMsg(null);
  };

  return (
    <IonPage className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar className="px-2" style={{ "--background": "#ffffff" }}>
          <div className="flex items-center justify-between w-full pr-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <IonIcon icon={shieldCheckmarkOutline} className="text-2xl" />
              </div>
              <div>
                <IonTitle className="p-0 text-xl font-black tracking-tight text-slate-900">
                  BioChecador <span className="text-blue-600">PWA</span>
                </IonTitle>
              </div>
            </div>

            <IonChip
              color={biometricAvailable ? "success" : "medium"}
              className="m-0 font-bold text-xs shadow-sm bg-emerald-50 text-emerald-700 border border-emerald-200 px-3"
            >
              <IonIcon
                icon={fingerPrintOutline}
                className="text-base mr-1 text-emerald-600"
              />
              <IonLabel>
                {biometricAvailable ? "WebAuthn Listo" : "Sin Biometría"}
              </IonLabel>
            </IonChip>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="max-w-4xl mx-auto space-y-6 py-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-lg shadow-blue-500/15">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-blue-100 text-xs font-bold uppercase tracking-wider">
                  <IonIcon
                    icon={radioOutline}
                    className="animate-pulse text-emerald-300 text-base"
                  />
                  <span>Terminal de Asistencia Biométrica</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Panel de Control
                </h1>
                <p className="text-blue-100 text-sm max-w-md">
                  Verificación en tiempo real por WebAuthn FIDO2 y
                  geolocalización GPS.
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex items-center space-x-3 self-start md:self-auto">
                <IonIcon icon={timeOutline} className="text-2xl text-white" />
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
                {resultado && (
                  <IonButton
                    fill="outline"
                    size="small"
                    color="medium"
                    onClick={limpiarBusqueda}
                    className="font-bold text-xs rounded-xl"
                  >
                    <IonIcon slot="start" icon={refreshOutline} />
                    Limpiar
                  </IonButton>
                )}
              </div>
            </IonCardHeader>

            <IonCardContent className="p-5 bg-white">
              <form onSubmit={handleVerificarRfc} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <IonItem className="rounded-2xl border border-slate-300 flex-1 bg-white ion-no-padding px-3 shadow-inner">
                    <IonIcon
                      icon={personOutline}
                      slot="start"
                      className="text-slate-400 text-xl mr-2"
                    />
                    <IonInput
                      label="RFC del Colaborador"
                      labelPlacement="floating"
                      value={rfc}
                      onIonInput={(e) => setRfc(e.detail.value!)}
                      placeholder="Ej. LOGJ580812RH7"
                      maxlength={13}
                      className="font-mono uppercase font-black text-slate-900"
                    />
                  </IonItem>

                  <IonButton
                    type="submit"
                    disabled={loading}
                    className="h-14 font-extrabold text-base shadow-lg shadow-blue-500/25 rounded-2xl"
                    color="primary"
                  >
                    {loading ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      <>
                        <IonIcon slot="start" icon={searchOutline} />
                        Verificar RFC
                      </>
                    )}
                  </IonButton>
                </div>
              </form>

              {errorMsg && !resultado && (
                <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
                  <IonIcon
                    icon={alertCircleOutline}
                    className="text-2xl text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <div className="font-black text-sm">Aviso del Sistema</div>
                    <div className="text-xs text-amber-800 font-medium mt-0.5">
                      {errorMsg}
                    </div>
                  </div>
                </div>
              )}

              {resultado && (
                <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm">
                  <div className="bg-slate-900 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <IonAvatar className="w-12 h-12 border-2 border-white/20 shadow-md">
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center font-black text-lg text-white">
                          {(resultado.nombre || resultado.rfc)
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      </IonAvatar>

                      <div>
                        <h3 className="font-black text-base text-white leading-tight">
                          {resultado.nombre || "Colaborador Registrado"}
                        </h3>
                        <div className="font-mono text-xs text-blue-300 font-bold mt-0.5">
                          RFC: {resultado.rfc}
                        </div>
                      </div>
                    </div>

                    <IonBadge
                      color={resultado.tieneBiometria ? "success" : "warning"}
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

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="text-xs text-slate-500 font-mono font-bold">
                        ID Compañía: {resultado.numeroCompania}
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
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
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
                    {resultado.tieneBiometria ? (
                      <IonButton
                        expand="block"
                        color="success"
                        className="flex-1 font-black text-sm shadow-md shadow-emerald-500/20 h-12"
                      >
                        <IonIcon slot="start" icon={fingerPrintOutline} />
                        Proceder a Marcar Asistencia
                        <IonIcon slot="end" icon={arrowForwardOutline} />
                      </IonButton>
                    ) : (
                      <IonButton
                        expand="block"
                        color="warning"
                        className="flex-1 font-black text-sm shadow-md shadow-amber-500/20 h-12"
                      >
                        <IonIcon slot="start" icon={fingerPrintOutline} />
                        Enrolar Huella / Face ID
                        <IonIcon slot="end" icon={arrowForwardOutline} />
                      </IonButton>
                    )}
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        <IonToast
          isOpen={toastState.show}
          onDidDismiss={() => setToastState({ ...toastState, show: false })}
          message={toastState.message}
          duration={3000}
          color={toastState.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
