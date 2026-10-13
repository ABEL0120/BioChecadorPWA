import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonSpinner,
  useIonToast,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import {
  receiptOutline,
  documentTextOutline,
  codeSlashOutline,
  calendarOutline,
  searchOutline,
  refreshOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { useAuthSession } from "../context/AuthSessionContext";
import { useRecibosNomina } from "../hooks/useRecibosNomina";
import { SinSesionMensaje } from "../components/SinSesionMensaje";

const PAGE_SIZE = 15;

export const RecibosPage: React.FC = () => {
  const { user } = useAuthSession();
  const [presentToast] = useIonToast();
  const {
    recibos,
    loading,
    downloadingKey,
    error,
    fetchRecibos,
    descargarArchivo,
  } = useRecibosNomina();

  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

  const [fechaInicial, setFechaInicial] = useState<string>(
    getLocalDateStr(firstDayOfYear),
  );
  const [fechaFinal, setFechaFinal] = useState<string>(getLocalDateStr(now));
  const [filtrarPorFechas, setFiltrarPorFechas] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [recibos]);

  useEffect(() => {
    if (user?.numeroCompania && user?.numeroEmpleado) {
      if (filtrarPorFechas) {
        const fIni = fechaInicial ? fechaInicial.replace(/-/g, "/") : undefined;
        const fFin = fechaFinal ? fechaFinal.replace(/-/g, "/") : undefined;
        fetchRecibos(user.numeroCompania, user.numeroEmpleado, fIni, fFin, user.rfcCompania);
      } else {
        fetchRecibos(user.numeroCompania, user.numeroEmpleado, undefined, undefined, user.rfcCompania);
      }
    }
  }, [user]);

  const handleBuscar = () => {
    if (!user?.numeroCompania || !user?.numeroEmpleado) return;
    if (filtrarPorFechas) {
      const fIni = fechaInicial ? fechaInicial.replace(/-/g, "/") : undefined;
      const fFin = fechaFinal ? fechaFinal.replace(/-/g, "/") : undefined;
      fetchRecibos(user.numeroCompania, user.numeroEmpleado, fIni, fFin, user.rfcCompania);
    } else {
      fetchRecibos(user.numeroCompania, user.numeroEmpleado, undefined, undefined, user.rfcCompania);
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltrarPorFechas(true);
    setFechaInicial(getLocalDateStr(firstDayOfYear));
    setFechaFinal(getLocalDateStr(now));
    if (user?.numeroCompania && user?.numeroEmpleado) {
      const fIni = getLocalDateStr(firstDayOfYear).replace(/-/g, "/");
      const fFin = getLocalDateStr(now).replace(/-/g, "/");
      fetchRecibos(user.numeroCompania, user.numeroEmpleado, fIni, fFin, user.rfcCompania);
    }
  };

  const handleInfinite = (ev: CustomEvent<void>) => {
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, recibos.length));
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 250);
  };

  const recibosVisibles = recibos.slice(0, visibleCount);

  const onDescargar = async (
    anio: number,
    proceso: number,
    tipo: "pdf" | "xml",
    archivo: string,
  ) => {
    const res = await descargarArchivo(anio, proceso, tipo, archivo, user?.rfcCompania);
    if (!res.success) {
      presentToast({
        message:
          res.message || `Error al descargar el comprobante ${tipo.toUpperCase()}`,
        duration: 3500,
        color: "danger",
        position: "top",
      });
    } else {
      presentToast({
        message: `¡Descarga de comprobante ${tipo.toUpperCase()} iniciada!`,
        duration: 2500,
        color: "success",
        position: "top",
      });
    }
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
            Recibos de Nómina
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-slate-50">
        {!user ? (
          <SinSesionMensaje />
        ) : (
          <div className="px-3.5 sm:px-6 py-4 sm:py-6 pb-24 max-w-xl mx-auto space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs sm:text-sm font-bold rounded-2xl border border-red-100 flex items-start gap-2.5">
              <IonIcon
                icon={alertCircleOutline}
                className="text-lg shrink-0 mt-0.5"
              />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100/90 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Filtros de consulta
              </p>
              <button
                type="button"
                onClick={handleLimpiarFiltros}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all"
              >
                Restablecer filtros
              </button>
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/80 cursor-pointer select-none transition-colors">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filtrarPorFechas}
                  onChange={(e) => setFiltrarPorFechas(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  Filtrar por rango de fechas
                </span>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  filtrarPorFechas
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {filtrarPorFechas ? "Por rango" : "Todas las fechas"}
              </span>
            </label>

            <div
              className={`grid grid-cols-2 gap-2.5 sm:gap-3 transition-opacity duration-200 ${
                !filtrarPorFechas ? "opacity-35 pointer-events-none" : ""
              }`}
            >
              <div className="min-w-0">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                  Desde
                </label>
                <input
                  type="date"
                  disabled={!filtrarPorFechas}
                  value={fechaInicial}
                  onChange={(e) => setFechaInicial(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-700 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 transition-all min-h-11"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                  Hasta
                </label>
                <input
                  type="date"
                  disabled={!filtrarPorFechas}
                  value={fechaFinal}
                  onChange={(e) => setFechaFinal(e.target.value)}
                  className="w-full text-xs sm:text-sm font-bold text-slate-700 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 transition-all min-h-11"
                />
              </div>
            </div>

            <button
              onClick={handleBuscar}
              disabled={loading}
              className="w-full h-14 rounded-2xl font-black text-sm tracking-wide transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {loading ? (
                <IonSpinner name="crescent" className="w-5 h-5 text-white" />
              ) : (
                <>
                  <IonIcon icon={searchOutline} className="text-lg" />
                  <span>Buscar Recibos</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 p-4 rounded-3xl border border-blue-100 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                <IonIcon icon={receiptOutline} className="text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-blue-600/80 tracking-wider">
                  Comprobantes Disponibles
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  {recibos.length}{" "}
                  {recibos.length === 1
                    ? "recibo encontrado"
                    : "recibos encontrados"}
                  {recibos.length > visibleCount && (
                    <span className="text-xs font-normal text-slate-500 block sm:inline sm:ml-1">
                      (mostrando {recibosVisibles.length})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* <button
              onClick={handleBuscar}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            >
              <IonIcon icon={refreshOutline} className="text-base" />
            </button> */}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <IonSpinner name="crescent" className="text-blue-500 w-8 h-8" />
            </div>
          ) : recibos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
              <IonIcon
                icon={receiptOutline}
                className="text-5xl text-slate-300 mb-2"
              />
              <p className="text-sm font-bold text-slate-600">
                No hay recibos disponibles
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No se encontraron recibos de nómina timbrados para el periodo o
                fechas seleccionadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recibosVisibles.map((recibo) => {
                const isDownloadingPdf =
                  downloadingKey ===
                  `${recibo.anio}_${recibo.proceso}_pdf_${recibo.nombreArchivo}`;
                const isDownloadingXml =
                  downloadingKey ===
                  `${recibo.anio}_${recibo.proceso}_xml_${recibo.nombreArchivo}`;

                return (
                  <div
                    key={`${recibo.anio}_${recibo.proceso}_${recibo.nombreArchivo}`}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                          Año {recibo.anio} • Proceso {recibo.proceso}
                        </span>
                        <p className="text-sm font-black text-slate-800 mt-1">
                          Periodo de Nómina
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                          Fecha de Pago
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {recibo.fechaPago || "---"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center gap-2.5 text-xs font-bold text-slate-600">
                      <IonIcon
                        icon={calendarOutline}
                        className="text-blue-500 text-base shrink-0"
                      />
                      <span className="truncate">
                        Del {recibo.fechaInicio || "---"} al{" "}
                        {recibo.fechaTermino || "---"}
                      </span>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={!recibo.tienePdf || isDownloadingPdf}
                        onClick={() =>
                          onDescargar(
                            recibo.anio,
                            recibo.proceso,
                            "pdf",
                            recibo.nombreArchivo,
                          )
                        }
                        className={`w-full h-14 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                          recibo.tienePdf
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                            : "bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isDownloadingPdf ? (
                          <IonSpinner
                            name="crescent"
                            className="w-5 h-5 text-white"
                          />
                        ) : (
                          <>
                            <IonIcon
                              icon={documentTextOutline}
                              className="text-lg sm:text-xl shrink-0"
                            />
                            <span>{recibo.tienePdf ? "Descargar PDF" : "Sin PDF"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!recibo.tieneXml || isDownloadingXml}
                        onClick={() =>
                          onDescargar(
                            recibo.anio,
                            recibo.proceso,
                            "xml",
                            recibo.nombreArchivo,
                          )
                        }
                        className={`w-full h-14 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                          recibo.tieneXml
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                            : "bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isDownloadingXml ? (
                          <IonSpinner
                            name="crescent"
                            className="w-5 h-5 text-white"
                          />
                        ) : (
                          <>
                            <IonIcon
                              icon={codeSlashOutline}
                              className="text-lg sm:text-xl shrink-0"
                            />
                            <span>{recibo.tieneXml ? "Descargar XML" : "Sin XML"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              <IonInfiniteScroll
                threshold="150px"
                disabled={visibleCount >= recibos.length}
                onIonInfinite={handleInfinite}
              >
                <IonInfiniteScrollContent
                  loadingSpinner="crescent"
                  loadingText="Cargando más comprobantes..."
                />
              </IonInfiniteScroll>
            </div>
          )}
        </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default RecibosPage;
