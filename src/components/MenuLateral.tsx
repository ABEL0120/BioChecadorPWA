import React, { useState } from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonFooter,
  useIonToast,
  IonSpinner,
} from "@ionic/react";
import {
  homeOutline,
  timeOutline,
  calendarOutline,
  syncOutline,
  mailOpenOutline,
} from "ionicons/icons";
import { useLocation } from "react-router-dom";
import { useAuthSession } from "../context/AuthSessionContext";

export const MenuLateral: React.FC = () => {
  const location = useLocation();
  const { refresh, user } = useAuthSession();
  const [present] = useIonToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [penaltySeconds, setPenaltySeconds] = useState(10);
  const cooldownRef = React.useRef(0);

  React.useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => {
          const next = prev - 1;
          cooldownRef.current = next;
          if (next <= 0) {
            clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRefresh = async () => {
    if (!user) {
      present({
        message: "Inicia sesión primero para actualizar datos.",
        duration: 3000,
        color: "warning",
      });
      return;
    }

    if (cooldownRef.current > 0) {
      let newPenalty = penaltySeconds * 2;
      if (newPenalty > 300) newPenalty = 300;
      setPenaltySeconds(newPenalty);
      setCooldown(newPenalty);
      cooldownRef.current = newPenalty;
      return;
    }

    setIsRefreshing(true);
    const result = await refresh();
    setIsRefreshing(false);

    if (result.success) {
      setPenaltySeconds(10);
      setCooldown(10);
      cooldownRef.current = 10;
    } else {
      setPenaltySeconds(10);
      setCooldown(10);
      cooldownRef.current = 10;
    }

    present({
      message: result.message,
      duration: 3000,
      color: result.success ? "success" : "warning",
      position: "top",
    });
  };

  const appPages = [
    {
      title: "Panel Principal",
      url: "/home",
      icon: homeOutline,
    },
    {
      title: "Historial de Asistencia",
      url: "/historial",
      icon: calendarOutline,
    },
    {
      title: "Mi Horario",
      url: "/horario",
      icon: timeOutline,
    },
    {
      title: "Solicitudes",
      url: "/solicitudes",
      icon: mailOpenOutline,
    },
  ];

  return (
    <IonMenu contentId="main-content" type="overlay" side="start">
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-transparent" style={{ "--background": "transparent" }}>
          <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-blue-50 to-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-md">
              <IonIcon icon={timeOutline} className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800 m-0 leading-none">
                Reloj Nómina
              </h2>
              <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mt-1">
                Control de Asistencia
              </p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding" style={{ "--background": "#ffffff" }}>
        <IonList className="bg-transparent pt-2" lines="none">
          {appPages.map((appPage, index) => {
            const isSelected = location.pathname === appPage.url;
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  routerLink={appPage.url}
                  routerDirection="none"
                  className="mb-2 mx-3"
                  detail={false}
                  lines="none"
                  style={{
                    "--padding-start": "0px",
                    "--inner-padding-end": "0px",
                    "--background": "transparent",
                    "--background-hover": "transparent",
                    "--background-activated": "transparent",
                  }}
                >
                  <div
                    className={`flex items-center w-full px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-transparent text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <IonIcon
                      icon={appPage.icon}
                      className={`text-[22px] mr-4 ${
                        isSelected ? "text-white" : "text-slate-400"
                      }`}
                    />
                    <IonLabel
                      className={`font-bold tracking-wide text-[15px] ${
                        isSelected ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {appPage.title}
                    </IonLabel>
                  </div>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
      
      <IonFooter className="ion-no-border bg-white">
        <div className="px-6 pb-10 pt-4 flex flex-col items-center">
          <button
            onClick={handleRefresh}
            className={`flex items-center justify-center gap-2 w-full py-4 squircle font-bold tracking-wide transition-all duration-300 shadow-sm ${
              cooldown > 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-300 active:scale-95"
            }`}
          >
            {isRefreshing ? (
              <IonSpinner name="crescent" className="w-5 h-5" />
            ) : (
              <IonIcon
                icon={syncOutline}
                className={`text-xl ${cooldown > 0 ? "opacity-50" : ""}`}
              />
            )}
            {cooldown > 0 ? `Espera ${cooldown}s` : "Sincronizar"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase hover:text-slate-700 transition-colors bg-transparent border-none mt-6"
          >
            Forzar Recarga
          </button>
        </div>
      </IonFooter>
    </IonMenu>
  );
};
