import React from "react";
import { IonIcon } from "@ionic/react";
import { timeOutline, cafeOutline, calendarOutline } from "ionicons/icons";
import { TurnoDetalleDto } from "../types/api";

interface HorarioSemanalProps {
  horario: TurnoDetalleDto[];
}

export const HorarioSemanal: React.FC<HorarioSemanalProps> = ({ horario }) => {
  let horarioArray: any[] = [];

  if (Array.isArray(horario)) {
    horarioArray = horario;
  } else if (horario && typeof horario === "object") {
    const possibleArray = Object.values(horario).find(val => Array.isArray(val));
    if (possibleArray) {
      horarioArray = possibleArray as any[];
    } else {
      horarioArray = [horario];
    }
  }

  if (!horarioArray || horarioArray.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4 p-5 flex flex-col items-center text-center">
        <IonIcon icon={calendarOutline} className="text-slate-300 text-4xl mb-2" />
        <h3 className="text-sm font-black text-slate-700">Sin Horario Asignado</h3>
        <p className="text-xs text-slate-500 mt-1">
          No tienes un horario configurado en el sistema. Podrás registrar tus asistencias libremente.
        </p>
      </div>
    );
  }

  const normalizeStr = (str: string) =>
    (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const diasOrden = [
    "sabado",
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
  ];

  // Ordenar de Sábado a Viernes
  horarioArray.sort((a, b) => {
    const idxA = diasOrden.indexOf(normalizeStr(a.diaNombre));
    const idxB = diasOrden.indexOf(normalizeStr(b.diaNombre));
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  const diasSemanaJS = [
    "domingo",
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];
  const nombreHoyJS = diasSemanaJS[new Date().getDay()];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-4">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center">
        <IonIcon icon={calendarOutline} className="text-blue-600 text-xl mr-2" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
          Horario Asignado
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {horarioArray.map((dia, idx) => {
          const isHoy =
            normalizeStr(dia.diaNombre) === nombreHoyJS ||
            horarioArray.length === 1;

          return (
            <div
              key={dia.diaNombre || idx}
              className={`flex items-center justify-between px-4 py-3 ${
                isHoy ? "bg-blue-50/50" : "bg-white"
              }`}
            >
              <div className="flex items-center space-x-3 w-1/3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                    isHoy
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : dia.esLaborable
                      ? "bg-slate-100 text-slate-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {(dia.diaNombre || "D").substring(0, 1).toUpperCase()}
                </div>
                <div
                  className={`text-sm font-bold ${
                    isHoy ? "text-blue-900" : "text-slate-700"
                  }`}
                >
                  {dia.diaNombre || `Día ${dia.diaIndice}`}
                  {isHoy && (
                    <span className="block text-[10px] uppercase text-blue-500 tracking-wider">
                      Hoy
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex justify-end">
                {!dia.esLaborable ? (
                  <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-black uppercase rounded-lg border border-slate-200">
                    Descanso
                  </div>
                ) : (
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center text-xs font-mono font-bold text-slate-700">
                      <IonIcon icon={timeOutline} className="mr-1 text-emerald-500" />
                      {dia.entrada || "--:--"} a {dia.salida || "--:--"}
                    </div>
                    {dia.salidaComida && dia.regresoComida && (
                      <div className="flex items-center text-[10px] font-mono font-bold text-slate-500">
                        <IonIcon icon={cafeOutline} className="mr-1 text-amber-500" />
                        Comida: {dia.salidaComida} - {dia.regresoComida}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
