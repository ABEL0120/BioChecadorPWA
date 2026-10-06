import React from "react";
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
  calendarOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  filterOutline,
} from "ionicons/icons";
import { useHistorial } from "../hooks/useHistorial";
import {
  DiaHistorialItem,
  DayData,
  SemaforoUI,
} from "../components/DiaHistorialItem";

const getSemaforoUI = (estado: DayData["estado"]): SemaforoUI | null => {
  switch (estado) {
    case "A_TIEMPO":
      return {
        text: "A Tiempo",
        icon: checkmarkCircleOutline,
        bg: "bg-emerald-50/80",
        border: "border-emerald-200",
        textCol: "text-emerald-700",
      };
    case "RETARDO":
      return {
        text: "Retardo",
        icon: alertCircleOutline,
        bg: "bg-amber-50/80",
        border: "border-amber-200",
        textCol: "text-amber-700",
      };
    case "RETARDO_MAYOR":
      return {
        text: "Retardo Mayor",
        icon: alertCircleOutline,
        bg: "bg-orange-50/80",
        border: "border-orange-200",
        textCol: "text-orange-700",
      };
    case "FALTA":
      return {
        text: "Falta",
        icon: closeCircleOutline,
        bg: "bg-red-50/80",
        border: "border-red-200",
        textCol: "text-red-700",
      };
    case "DESCANSO":
      return {
        text: "Descanso Lab.",
        icon: checkmarkCircleOutline,
        bg: "bg-slate-100",
        border: "border-slate-200",
        textCol: "text-slate-600",
      };
    default:
      return null;
  }
};

const formatDelay = (minutos: number): string => {
  if (minutos <= 0) return "A tiempo";
  const hrs = Math.floor(minutos / 60);
  const mins = Math.floor(minutos % 60);
  return hrs > 0 ? `+${hrs}h ${mins}m` : `+${mins}m`;
};

const HistorialPage: React.FC = () => {
  const {
    user,
    loading,
    error,
    startDateStr,
    setStartDateStr,
    endDateStr,
    setEndDateStr,
    diasDetallados,
  } = useHistorial();

  return (
    <IonPage id="historial-page" className="bg-slate-100">
      <IonHeader className="ion-no-border">
        <IonToolbar
          className="bg-white/80 backdrop-blur-lg border-b border-slate-100"
          style={{ "--background": "transparent" }}
        >
          <IonButtons slot="start" className="pl-1">
            <IonMenuButton className="text-slate-700" />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-800 text-lg">
            Historial
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-xl mx-auto py-4">
          {!user ? (
            <div className="text-center text-slate-500 font-bold mt-10">
              Inicia sesión para ver tu historial.
            </div>
          ) : (
            <>
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex flex-col gap-5 w-full box-border relative overflow-hidden">
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <IonIcon
                      icon={filterOutline}
                      className="text-blue-500 text-lg"
                    />
                  </div>
                  <span className="font-black tracking-wide text-slate-800 text-sm uppercase">
                    Filtro de Fechas
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <div className="w-full">
                    <label className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-widest ml-1 block mb-1.5">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase tracking-widest ml-1 block mb-1.5">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={endDateStr}
                      onChange={(e) => setEndDateStr(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-12">
                  <IonSpinner
                    name="crescent"
                    className="text-blue-500 w-8 h-8"
                  />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200 text-sm text-center shadow-sm">
                  {error}
                </div>
              ) : diasDetallados.length === 0 ? (
                <div className="text-center mt-8 bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
                  <IonIcon
                    icon={calendarOutline}
                    className="text-slate-200 text-6xl mb-4 block mx-auto"
                  />
                  <p className="text-slate-800 font-black tracking-wide text-lg">
                    Historial Vacío
                  </p>
                  <p className="text-slate-500 font-medium text-xs mt-2">
                    No tienes registros en este periodo.
                  </p>
                </div>
              ) : (
                <div className="w-full box-border pb-8">
                  {diasDetallados.map((dia, idx) => (
                    <DiaHistorialItem
                      key={idx}
                      dia={dia}
                      getSemaforoUI={getSemaforoUI}
                      formatDelay={formatDelay}
                      user={user}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HistorialPage;
