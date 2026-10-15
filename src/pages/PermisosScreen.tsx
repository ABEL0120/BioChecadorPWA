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
import { HistorialPermisos } from "../components/HistorialPermisos";
import { FormularioPermiso } from "../components/FormularioPermiso";
import { usePermisos } from "../hooks/usePermisos";
import { useAuthSession } from "../context/AuthSessionContext";
import { PermisoEmpleado } from "../services/permisosService";
import { SinSesionMensaje } from "../components/SinSesionMensaje";

export const PermisosScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"historial" | "nuevo">(
    "historial",
  );
  const [permisoAEditar, setPermisoAEditar] = useState<PermisoEmpleado | null>(
    null,
  );
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();

  const {
    datosIniciales,
    loadingDatos,
    historial,
    loadingHistorial,
    calculoTiempo,
    loadingCalculo,
    loadingSubmit,
    error,
    fetchDatosIniciales,
    fetchHistorial,
    handleCalcularTiempo,
    handleCrear,
    handleActualizar,
    handleCancelar,
    setCalculoTiempo,
  } = usePermisos();

  useEffect(() => {
    if (user?.numeroCompania && user?.numeroEmpleado) {
      fetchDatosIniciales(user.numeroCompania, user.numeroEmpleado);
      fetchHistorial(user.numeroCompania, user.numeroEmpleado);
    }
  }, [user, fetchDatosIniciales, fetchHistorial]);

  const onCancelRequest = async (numero: number) => {
    if (!user?.numeroCompania || !user?.numeroEmpleado) {
      return { success: false, message: "Sin sesión activa" };
    }
    const res = await handleCancelar({
      compania: user.numeroCompania,
      m103: user.numeroEmpleado,
      numero,
    });
    if (res.success) {
      presentToast({
        message: "¡Permiso cancelado exitosamente!",
        duration: 3000,
        color: "success",
        position: "top",
      });
    } else {
      presentToast({
        message: res.message,
        duration: 3500,
        color: "danger",
        position: "top",
      });
    }
    return res;
  };

  const handleEditarPermiso = (permiso: PermisoEmpleado) => {
    setPermisoAEditar(permiso);
    setActiveTab("nuevo");
  };

  const handleCancelarEdicion = () => {
    setPermisoAEditar(null);
    setActiveTab("historial");
  };

  const onFormSuccess = (msg?: string) => {
    const eraEdicion = !!permisoAEditar;
    setPermisoAEditar(null);
    setActiveTab("historial");
    presentToast({
      message:
        msg ||
        (eraEdicion
          ? "¡Permiso actualizado exitosamente!"
          : "¡Permiso solicitado exitosamente!"),
      duration: 3500,
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
            Mis Permisos
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

            <div className="flex bg-slate-200 p-1.5 rounded-2xl relative w-full mb-6 gap-1">
              <button
                onClick={() => {
                  setPermisoAEditar(null);
                  setActiveTab("historial");
                }}
                className={`flex-1 flex items-center justify-center h-12 min-h-12 text-xs sm:text-sm font-black uppercase tracking-wide transition-all duration-300 rounded-xl z-10 outline-none shrink-0 ${
                  activeTab === "historial"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Historial
              </button>
              <button
                onClick={() => setActiveTab("nuevo")}
                className={`flex-1 flex items-center justify-center h-12 min-h-12 text-xs sm:text-sm font-black uppercase tracking-wide transition-all duration-300 rounded-xl z-10 outline-none shrink-0 ${
                  activeTab === "nuevo"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {permisoAEditar ? "Editar Permiso" : "Nuevo Permiso"}
              </button>
            </div>

            <div className="mt-2">
              {activeTab === "historial" ? (
                <HistorialPermisos
                  permisos={historial}
                  loading={loadingHistorial}
                  onEditar={handleEditarPermiso}
                  onCancelar={onCancelRequest}
                />
              ) : loadingDatos ? (
                <div className="flex justify-center py-20">
                  <IonSpinner
                    name="crescent"
                    className="text-blue-500 w-8 h-8"
                  />
                </div>
              ) : datosIniciales ? (
                <FormularioPermiso
                  compania={user.numeroCompania || 0}
                  m103={user.numeroEmpleado || 0}
                  datosIniciales={datosIniciales}
                  permisoEditar={permisoAEditar}
                  onCancelarEdicion={handleCancelarEdicion}
                  calculoTiempo={calculoTiempo}
                  loadingCalculo={loadingCalculo}
                  loadingSubmit={loadingSubmit}
                  onCalcularTiempo={handleCalcularTiempo}
                  clearCalculo={() => setCalculoTiempo(null)}
                  onSubmit={handleCrear}
                  onActualizar={handleActualizar}
                  onSuccess={onFormSuccess}
                />
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold text-sm">
                  No se pudieron cargar los datos del empleado.
                </div>
              )}
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};
