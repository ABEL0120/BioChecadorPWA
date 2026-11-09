import React, { useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  calendarOutline,
  moonOutline,
  gridOutline,
  listOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { HorarioDto, TurnoDetalleDto } from "../types/api";

interface HorarioSemanalProps {
  horario: TurnoDetalleDto[] | HorarioDto;
  nombreEmpleado?: string;
  razonSocial?: string;
  rfc?: string;
  numeroEmpleado?: number;
}

export const HorarioSemanal: React.FC<HorarioSemanalProps> = ({
  horario,
  nombreEmpleado,
  razonSocial,
  rfc,
  numeroEmpleado,
}) => {
  const [vista, setVista] = useState<"tabla" | "tarjetas">("tabla");
  const [colapsado, setColapsado] = useState(false);

  let horarioArray: TurnoDetalleDto[] = [];
  let descripcionHorario = "";

  if (Array.isArray(horario)) {
    horarioArray = horario;
  } else if (horario && typeof horario === "object") {
    const h = horario as any;
    descripcionHorario = h.descripcion || "";
    if (h.dias && Array.isArray(h.dias)) {
      horarioArray = h.dias;
    } else {
      const possibleArray = Object.values(horario).find((val) =>
        Array.isArray(val),
      );
      if (possibleArray) {
        horarioArray = possibleArray as TurnoDetalleDto[];
      } else {
        horarioArray = [horario as unknown as TurnoDetalleDto];
      }
    }
  }

  if (!horarioArray || horarioArray.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
          <IonIcon icon={calendarOutline} className="text-3xl" />
        </div>
        <h3 className="text-base font-black text-slate-800 tracking-tight">
          Sin Horario Asignado
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          No tienes un horario registrado en el sistema. Puedes registrar tus
          asistencias libremente.
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

  horarioArray = [...horarioArray].sort((a, b) => {
    const idxA = a.diaIndice !== undefined ? a.diaIndice : 99;
    const idxB = b.diaIndice !== undefined ? b.diaIndice : 99;
    return idxA - idxB;
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

  const getDayValues = (dia: TurnoDetalleDto) => {
    const raw = dia as any;
    const esLaborable = (dia.esLaborable ?? raw.EsLaborable) !== false;
    const entrada = dia.entrada ?? raw.Entrada ?? "";
    const salida = dia.salida ?? raw.Salida ?? "";
    const toleranciaEntrada =
      dia.toleranciaEntradaMinutos ?? raw.ToleranciaEntradaMinutos ?? 0;
    const salidaComida = dia.salidaComida ?? raw.SalidaComida ?? "";
    const regresoComida = dia.regresoComida ?? raw.RegresoComida ?? "";
    const toleranciaComida =
      dia.toleranciaComidaMinutos ?? raw.ToleranciaComidaMinutos ?? 0;
    const tieneComida = Boolean(
      esLaborable &&
      salidaComida &&
      regresoComida &&
      salidaComida !== "00:00" &&
      regresoComida !== "00:00",
    );

    return {
      esLaborable,
      entrada: esLaborable ? entrada || "00:00" : "—",
      salida: esLaborable ? salida || "00:00" : "—",
      toleranciaEntrada: esLaborable ? toleranciaEntrada : 0,
      salidaComida: tieneComida ? salidaComida : esLaborable ? "00:00" : "—",
      regresoComida: tieneComida ? regresoComida : esLaborable ? "00:00" : "—",
      toleranciaComida: tieneComida ? toleranciaComida : 0,
      tieneComida,
    };
  };

  return (
    <div className="space-y-4">
      {(nombreEmpleado || razonSocial) && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              {(nombreEmpleado || "EM").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-800 leading-tight">
                {nombreEmpleado || "Empleado"}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-400">
                {numeroEmpleado && <span>#{numeroEmpleado}</span>}
                {numeroEmpleado && rfc && <span>•</span>}
                {rfc && <span className="font-mono uppercase">{rfc}</span>}
              </div>
            </div>
          </div>
          {razonSocial && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] font-bold text-slate-600 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span className="truncate max-w-[280px]">{razonSocial}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/70 shadow-2xs">
              <IonIcon icon={calendarOutline} className="text-xl sm:text-2xl" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-wide">
                Horario Asignado
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-0.5">
                {descripcionHorario || "Jornada oficial de trabajo y descansos"}
              </p>
            </div>
          </div>

          <div
            className="relative flex items-center p-[3px] bg-slate-200/90 rounded-full border border-slate-300/70 shadow-inner select-none self-start sm:self-auto shrink-0"
            style={{ width: "220px", height: "38px" }}
          >
            <div
              className="absolute top-[3px] bottom-[3px] transition-all duration-200 ease-out bg-white rounded-full shadow-sm border border-slate-200/60"
              style={{
                width: "calc(50% - 3px)",
                left: vista === "tabla" ? "3px" : "50%",
              }}
            />
            <button
              type="button"
              onClick={() => setVista("tabla")}
              className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-black transition-colors rounded-full ${
                vista === "tabla"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <IonIcon icon={gridOutline} className="text-sm shrink-0" />
              <span>Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => setVista("tarjetas")}
              className={`relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-black transition-colors rounded-full ${
                vista === "tarjetas"
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <IonIcon icon={listOutline} className="text-sm shrink-0" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {vista === "tabla" ? (
          <div
            onScroll={(e) => {
              const isCol = e.currentTarget.scrollLeft > 15;
              if (colapsado !== isCol) {
                setColapsado(isCol);
              }
            }}
            className="overflow-x-auto"
          >
            <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/90 text-slate-700 font-black text-xs uppercase tracking-wider">
                  <th
                    className={`sticky left-0 z-20 bg-slate-50/95 backdrop-blur-sm text-center align-middle border-b border-r border-slate-200/80 shadow-[1px_0_0_0_rgba(226,232,240,0.8)] transition-all duration-200 py-3.5 ${
                      colapsado
                        ? "w-14 min-w-[56px] max-w-[56px] px-1"
                        : "w-40 sm:w-48 px-3"
                    }`}
                  >
                    {colapsado ? (
                      <div className="flex flex-col items-center justify-center">
                        <IonIcon
                          icon={calendarOutline}
                          className="text-base text-slate-600"
                        />
                      </div>
                    ) : (
                      "Día"
                    )}
                  </th>
                  <th className="py-3.5 px-3 text-center border-b border-slate-200/80 w-28 sm:w-36">
                    Entrada
                  </th>
                  <th className="py-3.5 px-3 text-center border-b border-slate-200/80 w-28 sm:w-36">
                    Salida a Comer
                  </th>
                  <th className="py-3.5 px-3 text-center border-b border-slate-200/80 w-28 sm:w-36">
                    Regreso Comer
                  </th>
                  <th className="py-3.5 px-3 text-center border-b border-slate-200/80 w-28 sm:w-36">
                    Salida
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {horarioArray.map((dia, idx) => {
                  const vals = getDayValues(dia);
                  const isHoy =
                    normalizeStr(dia.diaNombre) === nombreHoyJS ||
                    horarioArray.length === 1;

                  return (
                    <tr
                      key={dia.diaNombre || idx}
                      className={`transition-colors hover:bg-slate-50/60 ${
                        isHoy ? "bg-blue-50/20" : "bg-white"
                      }`}
                    >
                      <td
                        className={`sticky left-0 z-10 p-0 border-r border-slate-200/80 transition-all duration-200 shadow-[1px_0_0_0_rgba(226,232,240,0.8)] align-middle ${
                          colapsado
                            ? "w-14 min-w-[56px] max-w-[56px]"
                            : "w-40 sm:w-48"
                        } ${
                          isHoy
                            ? "bg-blue-50/95 backdrop-blur-sm border-l-4 border-l-blue-600"
                            : "bg-white"
                        }`}
                      >
                        {colapsado ? (
                          <div className="flex flex-col items-center justify-center w-full min-h-[58px] py-1">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                isHoy
                                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30"
                                  : vals.esLaborable
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-slate-100/70 text-slate-400"
                              }`}
                            >
                              {(dia.diaNombre || "D")
                                .substring(0, 1)
                                .toUpperCase()}
                            </div>
                            {!vals.esLaborable && (
                              <span className="text-[7px] font-bold uppercase text-slate-400 tracking-tighter mt-0.5">
                                Desc
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full min-h-[60px] relative px-3">
                            <div className="flex items-center gap-3 w-[110px]">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                  isHoy
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : vals.esLaborable
                                      ? "bg-slate-100 text-slate-700"
                                      : "bg-slate-100/70 text-slate-400"
                                }`}
                              >
                                {(dia.diaNombre || "D")
                                  .substring(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div className="flex flex-col items-start">
                                <span
                                  className={`text-[14px] font-black capitalize tracking-tight leading-none ${
                                    isHoy ? "text-blue-900" : "text-slate-800"
                                  }`}
                                >
                                  {dia.diaNombre || `Día ${dia.diaIndice}`}
                                </span>
                                {!vals.esLaborable && (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">
                                    Descanso
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                        {vals.esLaborable ? (
                          <div className="inline-flex flex-col items-center justify-center">
                            <span className="inline-flex items-center justify-center min-w-[70px] sm:min-w-[80px] h-7 sm:h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs sm:text-[13px] tracking-wider shadow-xs">
                              {vals.entrada}
                            </span>
                            {vals.toleranciaEntrada > 0 && (
                              <span className="text-[9px] text-slate-400 font-mono font-medium mt-0.5">
                                tol. {vals.toleranciaEntrada}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm font-medium">
                            —
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                        {vals.esLaborable ? (
                          <span className="inline-flex items-center justify-center min-w-[70px] sm:min-w-[80px] h-7 sm:h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs sm:text-[13px] tracking-wider shadow-xs">
                            {vals.salidaComida}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm font-medium">
                            —
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                        {vals.esLaborable ? (
                          <div className="inline-flex flex-col items-center justify-center">
                            <span className="inline-flex items-center justify-center min-w-[70px] sm:min-w-[80px] h-7 sm:h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs sm:text-[13px] tracking-wider shadow-xs">
                              {vals.regresoComida}
                            </span>
                            {vals.tieneComida && vals.toleranciaComida > 0 && (
                              <span className="text-[9px] text-slate-400 font-mono font-medium mt-0.5">
                                tol. {vals.toleranciaComida}m
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm font-medium">
                            —
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                        {vals.esLaborable ? (
                          <span className="inline-flex items-center justify-center min-w-[70px] sm:min-w-[80px] h-7 sm:h-8 px-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs sm:text-[13px] tracking-wider shadow-xs">
                            {vals.salida}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm font-medium">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3.5 sm:p-5 space-y-3.5">
            {horarioArray.map((dia, idx) => {
              const vals = getDayValues(dia);
              const isHoy =
                normalizeStr(dia.diaNombre) === nombreHoyJS ||
                horarioArray.length === 1;

              return (
                <div
                  key={dia.diaNombre || idx}
                  className={`rounded-2xl border transition-all p-4 ${
                    isHoy
                      ? "bg-white border-blue-300 shadow-md ring-2 ring-blue-500/10"
                      : "bg-white border-slate-200/80 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isHoy
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : vals.esLaborable
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-100/70 text-slate-400"
                        }`}
                      >
                        {(dia.diaNombre || "D").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm sm:text-base capitalize tracking-tight">
                          {dia.diaNombre || `Día ${dia.diaIndice}`}
                        </h4>
                        {/* <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {vals.esLaborable
                            ? "Turno Laborable"
                            : "Día de Descanso"}
                        </span> */}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          vals.esLaborable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {vals.esLaborable ? "Laborable" : "Descanso"}
                      </span>
                    </div>
                  </div>

                  {vals.esLaborable ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5">
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Entrada
                        </span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {vals.entrada}
                        </span>
                        {vals.toleranciaEntrada > 0 && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            tol. {vals.toleranciaEntrada}m
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Salida a Comer
                        </span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {vals.salidaComida}
                        </span>
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Regreso Comer
                        </span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {vals.regresoComida}
                        </span>
                        {vals.tieneComida && vals.toleranciaComida > 0 && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            tol. {vals.toleranciaComida}m
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 text-center shadow-2xs">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Salida
                        </span>
                        <span className="font-mono font-black text-slate-800 text-sm">
                          {vals.salida}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                      <IonIcon icon={moonOutline} className="text-base" />
                      <span>Día de descanso oficial.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs font-medium">
          <IonIcon
            icon={informationCircleOutline}
            className="text-base text-blue-500 shrink-0"
          />
          <span>
            La tolerancia de entrada y comida son minutos de cortesía oficiales
            antes de considerar retardo.
          </span>
        </div> */}
      </div>
    </div>
  );
};
