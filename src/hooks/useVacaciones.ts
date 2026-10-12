import { useState, useCallback } from "react";
import {
  vacacionesService,
  DatosInicialesVacaciones,
  CalcularFechasRequest,
  CalcularFechasResponse,
  SolicitudVacacion,
  CrearSolicitud,
  CancelarSolicitud,
  ActualizarSolicitud,
} from "../services/vacacionesService";
import { formatError } from "../utils/errorHandler";

export const useVacaciones = () => {
  const [datosIniciales, setDatosIniciales] =
    useState<DatosInicialesVacaciones | null>(null);
  const [loadingDatos, setLoadingDatos] = useState<boolean>(false);

  const [historial, setHistorial] = useState<SolicitudVacacion[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState<boolean>(false);

  const [calculoFechas, setCalculoFechas] =
    useState<CalcularFechasResponse | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState<boolean>(false);

  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatosIniciales = useCallback(
    async (compania: number, m103: number) => {
      setLoadingDatos(true);
      setError(null);
      try {
        const res = await vacacionesService.obtenerDatosIniciales(
          compania,
          m103,
        );
        if (res.success) {
          setDatosIniciales(res.data);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(formatError(err, "Error al obtener datos iniciales"));
      } finally {
        setLoadingDatos(false);
      }
    },
    [],
  );

  const fetchHistorial = useCallback(async (compania: number, m103: number) => {
    setLoadingHistorial(true);
    try {
      const res = await vacacionesService.obtenerHistorial(compania, m103);
      if (res.success) {
        setHistorial(res.data || []);
      }
    } catch (err: any) {
      setError(formatError(err, "Error al obtener el historial"));
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  const handleCalcularFechas = async (payload: CalcularFechasRequest) => {
    setLoadingCalculo(true);
    setCalculoFechas(null);
    try {
      const res = await vacacionesService.calcularFechas(payload);
      if (res.success) {
        setCalculoFechas(res.data);
      }
    } catch (err: any) {
      setError(formatError(err, "Error al calcular las fechas"));
    } finally {
      setLoadingCalculo(false);
    }
  };

  const handleCrear = async (
    payload: CrearSolicitud,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await vacacionesService.crearSolicitud(payload);
      if (res.success) {
        await Promise.all([
          fetchHistorial(payload.compania, payload.m103),
          fetchDatosIniciales(payload.compania, payload.m103),
        ]);
      }
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return {
        success: false,
        message: formatError(err, "Error al crear la solicitud"),
      };
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleActualizar = async (
    payload: ActualizarSolicitud,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await vacacionesService.actualizarSolicitud(payload);
      if (res.success) {
        await Promise.all([
          fetchHistorial(payload.compania, payload.m103),
          fetchDatosIniciales(payload.compania, payload.m103),
        ]);
      }
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return {
        success: false,
        message: formatError(err, "Error al actualizar la solicitud"),
      };
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancelar = async (
    payload: CancelarSolicitud,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await vacacionesService.cancelarSolicitud(payload);
      if (res.success) {
        await Promise.all([
          fetchHistorial(payload.compania, payload.m103),
          fetchDatosIniciales(payload.compania, payload.m103),
        ]);
      }
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return {
        success: false,
        message: formatError(err, "Error al cancelar la solicitud"),
      };
    } finally {
      setLoadingSubmit(false);
    }
  };

  return {
    datosIniciales,
    loadingDatos,
    historial,
    loadingHistorial,
    calculoFechas,
    loadingCalculo,
    loadingSubmit,
    error,
    fetchDatosIniciales,
    fetchHistorial,
    handleCalcularFechas,
    handleCrear,
    handleActualizar,
    handleCancelar,
    setCalculoFechas,
  };
};
