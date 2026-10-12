import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  useIonToast,
} from "@ionic/react";
import { HistorialVacaciones } from "../components/HistorialVacaciones";
import { FormularioVacaciones } from "../components/FormularioVacaciones";
import { useVacaciones } from "../hooks/useVacaciones";
import { useAuthSession } from "../context/AuthSessionContext";
import { SolicitudVacacion } from "../services/vacacionesService";
import { SinSesionMensaje } from "../components/SinSesionMensaje";

export const VacacionesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"historial" | "nueva">(
    "historial",
  );
  const [solicitudAEditar, setSolicitudAEditar] =
    useState<SolicitudVacacion | null>(null);
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();

  const {
    datosIniciales,
    loadingDatos,
    historial,
    loadingHistorial,
    calculoFechas,
    loadingCalculo,
    loadingSubmit,
    error,
    fetchDatosIniciales,
    fetchHistorial,
    handleCalcularFechas,
    handleCrear,
    handleActualizar,
    handleCancelar,
    setCalculoFechas,
  } = useVacaciones();

  useEffect(() => {
    if (user?.numeroCompania && user?.numeroEmpleado) {
      fetchDatosIniciales(user.numeroCompania, user.numeroEmpleado);
      fetchHistorial(user.numeroCompania, user.numeroEmpleado);
    }
  }, [user, fetchDatosIniciales, fetchHistorial]);

  const onCancelRequest = async (numero: number, comentarios: string) => {
    if (!user?.numeroCompania || !user?.numeroEmpleado)
      return { success: false, message: "Sin sesión activa" };
    const res = await handleCancelar({
      compania: user.numeroCompania,
      m103: user.numeroEmpleado,
      numero,
      comentarios,
    });
    if (res.success) {
      if (user?.numeroCompania && user?.numeroEmpleado) {
        fetchDatosIniciales(user.numeroCompania, user.numeroEmpleado);
      }
      presentToast({
        message: "¡Solicitud cancelada exitosamente!",
        duration: 3000,
        color: "success",
        position: "top",
      });
    }
    return res;
  };

  const onCalcularFechas = (
    fechaInicio: string,
    diasSolicitados: number,
    periodo: string,
  ) => {
    if (!user?.numeroCompania || !user?.numeroEmpleado) return;
    const cleanDate = fechaInicio.replace(/-/g, "/");
    handleCalcularFechas({
      compania: user.numeroCompania,
      m103: user.numeroEmpleado,
      fechaInicio: cleanDate,
      diasSolicitados,
      periodo,
    });
  };

  const handleEditarSolicitud = (sol: SolicitudVacacion) => {
    setSolicitudAEditar(sol);
    setActiveTab("nueva");
  };

  const handleCancelarEdicion = () => {
    setSolicitudAEditar(null);
    setActiveTab("historial");
  };

  const onFormSuccess = () => {
    if (user?.numeroCompania && user?.numeroEmpleado) {
      fetchDatosIniciales(user.numeroCompania, user.numeroEmpleado);
      fetchHistorial(user.numeroCompania, user.numeroEmpleado);
    }
    const eraEdicion = !!solicitudAEditar;
    setSolicitudAEditar(null);
    setActiveTab("historial");
    presentToast({
      message: eraEdicion
        ? "¡Solicitud actualizada exitosamente!"
        : "¡Solicitud enviada exitosamente!",
      duration: 3000,
      color: "success",
      position: "top",
    });
  };

  return (
    <IonPage className="bg-slate-50">
      <IonHeader className="ion-no-border">
        <IonToolbar
          className="bg-slate-50 border-b border-slate-200"
          style={{ "--background": "#f8fafc" }}
        >
          <IonButtons slot="start" className="pl-2">
            <IonMenuButton className="text-slate-700" />
          </IonButtons>
          <IonTitle className="text-slate-800 font-black tracking-wide">
            Mis Vacaciones
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-slate-50">
        {!user ? (
          <SinSesionMensaje />
        ) : (
          <div className="px-3.5 sm:px-6 py-4 sm:py-6 pb-24 max-w-xl mx-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <div className="flex bg-slate-200 p-1.5 rounded-2xl relative w-full mb-6">
              <button
                onClick={() => setActiveTab("historial")}
                className={`flex-1 flex items-center justify-center py-3.5 min-h-12 text-sm font-bold uppercase transition-all duration-300 rounded-xl z-10 outline-none ${
                  activeTab === "historial"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Historial
              </button>
              <button
                onClick={() => setActiveTab("nueva")}
                className={`flex-1 flex items-center justify-center py-3.5 min-h-12 text-sm font-bold uppercase transition-all duration-300 rounded-xl z-10 outline-none ${
                  activeTab === "nueva"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {solicitudAEditar ? "Editar Solicitud" : "Nueva Solicitud"}
              </button>
            </div>

            <div className="mt-2">
              {activeTab === "historial" ? (
                <HistorialVacaciones
                  solicitudes={historial}
                  periodos={datosIniciales?.periodosHistorial || []}
                  loading={loadingHistorial}
                  onEditar={handleEditarSolicitud}
                  onCancelar={onCancelRequest}
                />
              ) : loadingDatos ? (
                <div className="flex justify-center py-20">
                  <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
                </div>
              ) : datosIniciales ? (
                <FormularioVacaciones
                  compania={user?.numeroCompania || 0}
                  m103={user?.numeroEmpleado || 0}
                  datosIniciales={datosIniciales}
                  solicitudes={historial}
                  calculoFechas={calculoFechas}
                  loadingCalculo={loadingCalculo}
                  loadingSubmit={loadingSubmit}
                  solicitudEditar={solicitudAEditar}
                  onCancelarEdicion={handleCancelarEdicion}
                  onCalcularFechas={onCalcularFechas}
                  clearCalculo={() => setCalculoFechas(null)}
                  onSubmit={handleCrear}
                  onActualizar={handleActualizar}
                  onSuccess={onFormSuccess}
                />
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  No se pudieron cargar los datos iniciales.
                </div>
              )}
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};
