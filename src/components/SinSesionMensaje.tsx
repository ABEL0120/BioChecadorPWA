import React from "react";

interface Props {
  mensaje?: string;
}

export const SinSesionMensaje: React.FC<Props> = ({
  mensaje = "Primero ingresa tu RFC en el panel principal para consultar tu información.",
}) => {
  return (
    <div className="flex items-center justify-center min-h-[50vh] px-4 py-8">
      <div className="text-center bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-100 max-w-sm w-full mx-auto">
        <h3 className="text-base font-black text-slate-800 tracking-tight mb-2">
          Sesión Requerida
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
          {mensaje}
        </p>
      </div>
    </div>
  );
};
