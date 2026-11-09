import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { HorarioSemanal } from "../components/HorarioSemanal";
import { useAuthSession } from "../context/AuthSessionContext";
import { SinSesionMensaje } from "../components/SinSesionMensaje";

const HorarioPage: React.FC = () => {
  const { user } = useAuthSession();

  return (
    <IonPage id="horario-page" className="bg-slate-100">
      <IonHeader className="ion-no-border border-b border-slate-200 bg-white">
        <IonToolbar style={{ "--background": "#ffffff" }}>
          <IonButtons slot="start" className="pl-2">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-black tracking-tight text-slate-900">
            Mi Horario
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ "--background": "#f8fafc" }}>
        <div className="max-w-5xl mx-auto space-y-5 py-3 pb-24">
          {user ? (
            <HorarioSemanal
              horario={user.horario || []}
              nombreEmpleado={user.nombre}
              // razonSocial={user.razonSocial}
              // rfc={user.rfc}
              // numeroEmpleado={user.numeroEmpleado}
            />
          ) : (
            <SinSesionMensaje />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HorarioPage;
