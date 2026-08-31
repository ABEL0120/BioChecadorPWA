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
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonTitle className="font-black tracking-tight text-slate-900">
            Menú
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <IonList className="bg-transparent" lines="none">
          {appPages.map((appPage, index) => {
            const isSelected = location.pathname === appPage.url;
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  routerLink={appPage.url}
                  routerDirection="none"
                  className={`mb-2 rounded-xl cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white border border-slate-100"
                  }`}
                  detail={false}
                >
                  <IonIcon
                    slot="start"
                    icon={appPage.icon}
                    className={isSelected ? "text-blue-600" : "text-slate-500"}
                  />
                  <IonLabel
                    className={`font-bold ${isSelected ? "text-blue-700" : "text-slate-700"} pl-2`}
                  >
                    {appPage.title}
                  </IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
      <IonFooter className="ion-no-border bg-[#f8fafc]">
        <div className="px-4 pb-8 pt-2 flex flex-col items-center">
          <button
            onClick={handleRefresh}
            className={`flex items-center justify-center gap-2 w-full py-3 mb-8 rounded-xl font-bold transition-colors ${
              cooldown > 0
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
            {cooldown > 0 ? `Espera ${cooldown}s` : "Actualizar Datos"}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="text-[10px] text-slate-400 font-medium tracking-wide uppercase hover:text-slate-600 transition-colors bg-transparent border-none pb-2"
          >
            Forzar Recarga de App
          </button>
        </div>
      </IonFooter>
    </IonMenu>
  );
};
