import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  IonAlert,
} from "@ionic/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { IonReactRouter } from "@ionic/react-router";
import React, { lazy, Suspense } from "react";
import Home from "./pages/Home";
import { PwaInstallGate } from "./components/PwaInstallGate";
import { AuthSessionProvider } from "./context/AuthSessionContext";
import { OfflineBanner } from "./components/OfflineBanner";
import { MenuLateral } from "./components/MenuLateral";

const HorarioPage = lazy(() => import("./pages/HorarioPage"));
const HistorialPage = lazy(() => import("./pages/HistorialPage"));
const SolicitudesPage = lazy(() => import("./pages/SolicitudesPage"));
const VacacionesScreen = lazy(() =>
  import("./pages/VacacionesScreen").then((m) => ({
    default: m.VacacionesScreen,
  })),
);
const RecibosPage = lazy(() => import("./pages/RecibosPage"));
const NotificacionesPage = lazy(() => import("./pages/NotificacionesPage"));

const PageLoadingFallback: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50 min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-[11px] font-black tracking-wider uppercase text-slate-400">
        Cargando sección...
      </p>
    </div>
  </div>
);
import { IonSplitPane } from "@ionic/react";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "./theme/variables.css";

setupIonicReact();

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        const checkUpdate = () => {
          if (!(!r.installing && navigator)) return;
          if ("connection" in navigator && !navigator.onLine) return;
          r.update();
        };
        setInterval(checkUpdate, 15000);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkUpdate();
          }
        });
        window.addEventListener("focus", checkUpdate);
      }
    },
    onRegisterError(error) {},
  });

  return (
    <IonAlert
      isOpen={needRefresh}
      backdropDismiss={false}
      header="Actualización Disponible"
      message="Hay una nueva versión de la aplicación Reloj Nomina. Es obligatorio actualizar para continuar trabajando."
      buttons={[
        {
          text: "Actualizar Ahora",
          handler: async () => {
            await updateServiceWorker(true);
            setTimeout(() => {
              window.location.reload();
            }, 500);
          },
        },
      ]}
    />
  );
}

const App: React.FC = () => (
  <IonApp>
    <UpdatePrompt />
    <OfflineBanner />
    <AuthSessionProvider>
      <PwaInstallGate>
        <IonReactRouter>
          <IonSplitPane contentId="main-content">
            <MenuLateral />
            <IonRouterOutlet id="main-content">
              <Route exact path="/home">
                <Home />
              </Route>
              <Route exact path="/horario">
                <Suspense fallback={<PageLoadingFallback />}>
                  <HorarioPage />
                </Suspense>
              </Route>
              <Route exact path="/historial">
                <Suspense fallback={<PageLoadingFallback />}>
                  <HistorialPage />
                </Suspense>
              </Route>
              <Route exact path="/solicitudes">
                <Suspense fallback={<PageLoadingFallback />}>
                  <SolicitudesPage />
                </Suspense>
              </Route>
              <Route exact path="/vacaciones">
                <Suspense fallback={<PageLoadingFallback />}>
                  <VacacionesScreen />
                </Suspense>
              </Route>
              <Route exact path="/recibos">
                <Suspense fallback={<PageLoadingFallback />}>
                  <RecibosPage />
                </Suspense>
              </Route>
              <Route exact path="/notificaciones">
                <Suspense fallback={<PageLoadingFallback />}>
                  <NotificacionesPage />
                </Suspense>
              </Route>
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>
          </IonSplitPane>
        </IonReactRouter>
      </PwaInstallGate>
    </AuthSessionProvider>
  </IonApp>
);

export default App;
