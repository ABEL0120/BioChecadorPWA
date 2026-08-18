import React, { useState } from "react";
import { IonPage, IonContent, IonIcon, IonToast } from "@ionic/react";
import {
  fingerPrintOutline,
  locationOutline,
  timeOutline,
  checkmarkCircleOutline,
  personOutline,
  statsChartOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  alertCircleOutline,
  searchOutline,
  hardwareChipOutline,
  businessOutline,
} from "ionicons/icons";

interface AttendanceRecord {
  id: string;
  employeeName: string;
  rfc: string;
  time: string;
  status: "a_tiempo" | "retardo";
  location: string;
  biometricType: string;
  initials: string;
}

const mockRecords: AttendanceRecord[] = [
  {
    id: "1",
    employeeName: "Carlos Eduardo Gómez",
    rfc: "GOMC920415HG8",
    time: "08:58 AM",
    status: "a_tiempo",
    location: "Planta Central (19.4326, -99.1332)",
    biometricType: "Windows Hello",
    initials: "CG",
  },
  {
    id: "2",
    employeeName: "María Fernanda López",
    rfc: "LOPM881102KT4",
    time: "09:04 AM",
    status: "retardo",
    location: "Sucursal Norte (19.4891, -99.1211)",
    biometricType: "Face ID",
    initials: "ML",
  },
  {
    id: "3",
    employeeName: "Alejandro Ruiz Silva",
    rfc: "RUISA950718PL9",
    time: "08:55 AM",
    status: "a_tiempo",
    location: "Planta Central (19.4326, -99.1332)",
    biometricType: "Huella Android",
    initials: "AR",
  },
  {
    id: "4",
    employeeName: "Sofia Hernández Vela",
    rfc: "HERS910330MN2",
    time: "09:18 AM",
    status: "retardo",
    location: "Oficinas Sur (19.3512, -99.1724)",
    biometricType: "Touch ID",
    initials: "SH",
  },
];

const Home: React.FC = () => {
  const [filter, setFilter] = useState<string>("todos");
  const [searchText, setSearchText] = useState<string>("");
  const [rfcInput, setRfcInput] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredRecords = mockRecords.filter((record) => {
    const matchesFilter =
      filter === "todos" ||
      (filter === "a_tiempo" && record.status === "a_tiempo") ||
      (filter === "retardo" && record.status === "retardo");

    const matchesSearch =
      record.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      record.rfc.toLowerCase().includes(searchText.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSimulateCheckin = () => {
    if (!rfcInput.trim()) {
      setToastMessage(
        "Por favor ingrese un RFC válido para realizar el marcaje.",
      );
      return;
    }
    setToastMessage(
      `¡Asistencia de ${rfcInput.toUpperCase()} registrada con éxito! GPS y Biometría FIDO2 verificados.`,
    );
  };

  const handleSimulateRegister = () => {
    if (!rfcInput.trim()) {
      setToastMessage("Por favor ingrese un RFC para vincular la biometría.");
      return;
    }
    setToastMessage(
      `¡Dispositivo biométrico registrado correctamente para el RFC ${rfcInput.toUpperCase()}!`,
    );
  };

  return (
    <IonPage>
      <IonContent fullscreen className="bg-slate-950 text-slate-100 font-sans">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80 px-4 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <IonIcon
                  icon={fingerPrintOutline}
                  className="text-2xl text-white"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent leading-none">
                  BioChecador PWA
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Sistema Inteligente de Asistencia FIDO2 & GPS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setToastMessage("Datos de asistencias actualizados.")
                }
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Actualizar"
              >
                <IonIcon icon={refreshOutline} className="text-lg block" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 p-5 border border-slate-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Asistencias Hoy
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  84%
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">42</span>
                <span className="text-sm text-slate-400">/ 50 Empleados</span>
              </div>
              <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[84%]" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <IonIcon
                  icon={statsChartOutline}
                  className="text-indigo-400 text-sm"
                />
                <span>38 A tiempo • 4 Retardos</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 p-5 border border-slate-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Credenciales FIDO2
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  WebAuthn
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">128</span>
                <span className="text-sm text-slate-400">Dispositivos</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  className="text-indigo-400 text-sm"
                />
                <span>Llaves biométricas asociadas</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 p-5 border border-slate-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Geolocalización
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  GPS Alta Precisión
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">± 5m</span>
                <span className="text-sm text-slate-400">Tolerancia</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <IonIcon
                  icon={locationOutline}
                  className="text-cyan-400 text-sm"
                />
                <span>Geofencing de centro operativo</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/50 p-5 border border-slate-800/80 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Sensor Biométrico
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  Hardware
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  Listo
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <IonIcon
                  icon={hardwareChipOutline}
                  className="text-purple-400 text-sm"
                />
                <span>TouchID / FaceID / Windows Hello</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <IonIcon icon={fingerPrintOutline} className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Terminal de Asistencia
                    </h2>
                    <p className="text-xs text-slate-400">
                      Ingrese el RFC para checar o vincular dispositivo
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      RFC del Empleado
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <IonIcon icon={personOutline} className="text-lg" />
                      </div>
                      <input
                        type="text"
                        value={rfcInput}
                        onChange={(e) =>
                          setRfcInput(e.target.value.toUpperCase())
                        }
                        placeholder="EJ. GOMC920415HG8"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-4 py-3.5 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all uppercase"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      onClick={handleSimulateCheckin}
                      className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <IonIcon icon={fingerPrintOutline} className="text-lg" />
                      Checar Asistencia (GPS + Biometría)
                    </button>

                    <button
                      onClick={handleSimulateRegister}
                      className="w-full py-3.5 px-5 rounded-xl font-semibold text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="text-lg text-purple-400"
                      />
                      Vincular Biometría WebAuthn
                    </button>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/30 text-xs text-indigo-200/80 space-y-2">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <IonIcon icon={shieldCheckmarkOutline} /> Validación de
                    Seguridad FIDO2
                  </div>
                  <p className="leading-relaxed text-indigo-300/70">
                    El marcaje requiere verificación biométrica local sin enviar
                    la huella/rostro a servidores externos, garantizando
                    privacidad total y firma criptográfica.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Bitácora de Asistencias
                    </h2>
                    <p className="text-xs text-slate-400">
                      Registros en tiempo real con coordenadas GPS
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setFilter("todos")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filter === "todos"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilter("a_tiempo")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filter === "a_tiempo"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      A Tiempo
                    </button>
                    <button
                      onClick={() => setFilter("retardo")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        filter === "retardo"
                          ? "bg-amber-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Retardos
                    </button>
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <IonIcon icon={searchOutline} className="text-base" />
                  </div>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar por empleado o RFC..."
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No se encontraron registros que coincidan con la búsqueda.
                    </div>
                  ) : (
                    filteredRecords.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0 shadow-inner">
                            {item.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">
                                {item.employeeName}
                              </h3>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                                {item.rfc}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                              <IonIcon
                                icon={businessOutline}
                                className="text-indigo-400"
                              />
                              <span>{item.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                item.status === "a_tiempo"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {item.status === "a_tiempo"
                                ? "A tiempo"
                                : "Retardo"}
                            </span>
                            <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                              <IonIcon
                                icon={timeOutline}
                                className="text-slate-400"
                              />
                              {item.time}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {item.biometricType}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ""}
          duration={3500}
          onDidDismiss={() => setToastMessage(null)}
          className="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
