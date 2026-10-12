import React from "react";
import { IonIcon } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";

interface MiniCalendarioProps {
  fechaInicio: string;
  fechaFin: string;
  fechaRetorno: string;
  diasEfectivos?: string[];
  diasInhabiles?: string[];
  diasRestringidos?: string[];
  inicioSemana?: number;
}

export const MiniCalendario: React.FC<MiniCalendarioProps> = ({
  fechaInicio,
  fechaFin,
  fechaRetorno,
  diasEfectivos,
  diasInhabiles,
  diasRestringidos,
  inicioSemana = 0,
}) => {
  if (!fechaInicio || !fechaFin || !fechaRetorno) return null;

  const parseDate = (d: string) => new Date(d.replace(/-/g, "/"));
  const start = parseDate(fechaInicio);
  const end = parseDate(fechaFin);
  const ret = parseDate(fechaRetorno);
  const getMonthsBetween = (d1: Date, d2: Date) => {
    const months = [];
    const current = new Date(d1.getFullYear(), d1.getMonth(), 1);
    const last = new Date(d2.getFullYear(), d2.getMonth(), 1);
    while (current <= last) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isBetween = (d: Date, startD: Date, endD: Date) =>
    d >= startD && d <= endD;

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const monthsToRender = getMonthsBetween(start, ret);

  return (
    <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs mt-3 sm:mt-4 overflow-hidden">
      {monthsToRender.map((m, mIndex) => {
        const monthStart = new Date(m.getFullYear(), m.getMonth(), 1);
        const monthEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        const startDayOfWeek = monthStart.getDay();
        const blankDaysCount = (startDayOfWeek - inicioSemana + 7) % 7;
        const blankDays = Array(blankDaysCount).fill(null);
        const daysInMonth = Array.from(
          { length: monthEnd.getDate() },
          (_, i) => {
            return new Date(m.getFullYear(), m.getMonth(), i + 1);
          },
        );

        return (
          <div key={mIndex} className={mIndex > 0 ? "mt-8" : ""}>
            <div className="flex items-center gap-2 mb-4">
              <IonIcon
                icon={calendarOutline}
                className="text-blue-500 text-xl"
              />
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                {monthNames[m.getMonth()]} {m.getFullYear()}
              </h3>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {Array.from({ length: 7 }).map((_, i) => {
                const diasBase = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
                const diaLabel = diasBase[(inicioSemana + i) % 7];
                return (
                  <div
                    key={diaLabel}
                    className="text-[10px] font-black text-slate-400 uppercase"
                  >
                    {diaLabel}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blankDays.map((_, i) => (
                <div key={`blank-${i}`} className="h-8"></div>
              ))}

              {daysInMonth.map((day, i) => {
                const isStart = isSameDay(day, start);
                const isEnd = isSameDay(day, end);
                const isRet = isSameDay(day, ret);

                let inRange = false;
                let isWknd = false;
                let isRestringido = false;

                const dateStr = `${day.getFullYear()}/${(day.getMonth() + 1).toString().padStart(2, "0")}/${day.getDate().toString().padStart(2, "0")}`;

                if (diasRestringidos && diasRestringidos.includes(dateStr)) {
                  isRestringido = true;
                }

                if (diasEfectivos && diasInhabiles) {
                  inRange = diasEfectivos.includes(dateStr);
                  isWknd = diasInhabiles.includes(dateStr);
                } else {
                  inRange = isBetween(day, start, end);
                  isWknd = isWeekend(day);
                }

                let bgClass = "bg-slate-50 text-slate-600";
                let extraClass = "";

                if (isRestringido) {
                  bgClass =
                    "bg-red-500 text-white font-black shadow-md shadow-red-200 line-through";
                } else if (isRet) {
                  bgClass =
                    "bg-emerald-500 text-white font-black shadow-md shadow-emerald-200";
                } else if (inRange) {
                  bgClass =
                    "bg-blue-500 text-white font-black shadow-md shadow-blue-200";
                  if (isStart) extraClass = "rounded-l-xl";
                  if (isEnd) extraClass = "rounded-r-xl";
                  if (!isStart && !isEnd) extraClass = "opacity-90";
                } else if (isWknd && isBetween(day, start, end)) {
                  bgClass = "bg-slate-100 text-slate-400 line-through";
                } else if (isWknd && diasEfectivos) {
                  bgClass = "bg-slate-100 text-slate-400 line-through";
                }

                return (
                  <div
                    key={i}
                    className={`h-8 flex items-center justify-center text-xs rounded-lg ${bgClass} ${extraClass}`}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex flex-wrap gap-2.5 sm:gap-3 justify-center text-[10px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span>Vacaciones</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-200 rounded-sm border border-slate-300"></div>
          <span className="line-through">Inhábiles/Descansos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
          <span>Regreso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span>Restringido</span>
        </div>
      </div>
    </div>
  );
};
