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
        <div className="max-w-4xl mx-auto space-y-6 py-2">
          {user ? (
            <HorarioSemanal horario={user.horario || []} />
          ) : (
            <div className="text-center text-slate-500 font-medium mt-10">
              No hay una sesión activa. Busca tu RFC en el panel principal primero.
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HorarioPage;
