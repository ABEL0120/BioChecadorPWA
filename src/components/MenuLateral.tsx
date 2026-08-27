import React from "react";
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
} from "@ionic/react";
import { homeOutline, timeOutline, calendarOutline } from "ionicons/icons";
import { useLocation } from "react-router-dom";

export const MenuLateral: React.FC = () => {
  const location = useLocation();

  const appPages = [
    {
      title: "Panel Principal",
      url: "/home",
      icon: homeOutline,
    },
    {
      title: "Mi Horario",
      url: "/horario",
      icon: timeOutline,
    },
    {
      title: "Historial",
      url: "/historial",
      icon: calendarOutline,
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
        <div className="px-4 pb-6 pt-2 flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="text-[10px] text-slate-400 font-medium tracking-wide uppercase hover:text-slate-600 transition-colors bg-transparent border-none"
          >
            Forzar Recarga de App
          </button>
        </div>
      </IonFooter>
    </IonMenu>
  );
};
