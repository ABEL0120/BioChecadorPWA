import { useState, useCallback } from "react";
import {
  permisosService,
  DatosInicialesPermisos,
  CalcularTiempoRequest,
  CalcularTiempoResponse,
  PermisoEmpleado,
  CrearPermiso,
  ActualizarPermiso,
  CancelarPermiso,
} from "../services/permisosService";
import { formatError } from "../utils/errorHandler";

export const usePermisos = () => {
  const [datosIniciales, setDatosIniciales] =
    useState<DatosInicialesPermisos | null>(null);
  const [loadingDatos, setLoadingDatos] = useState<boolean>(false);

  const [historial, setHistorial] = useState<PermisoEmpleado[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState<boolean>(false);

  const [calculoTiempo, setCalculoTiempo] =
    useState<CalcularTiempoResponse | null>(null);
  const [loadingCalculo, setLoadingCalculo] = useState<boolean>(false);

  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatosIniciales = useCallback(
    async (compania: number, m103: number) => {
      setLoadingDatos(true);
      setError(null);
      try {
        const res = await permisosService.obtenerDatosIniciales(compania, m103);
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
      const res = await permisosService.obtenerHistorial(compania, m103);
      if (res.success) {
        setHistorial(res.data || []);
      }
    } catch (err: any) {
      setError(formatError(err, "Error al obtener historial"));
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  const handleCalcularTiempo = async (payload: CalcularTiempoRequest) => {
    setLoadingCalculo(true);
    try {
      const res = await permisosService.calcularTiempo(payload);
      if (res.success && res.data) {
        setCalculoTiempo(res.data);
      }
    } catch (err: any) {
      setError(formatError(err, "Error al calcular tiempo de permiso"));
    } finally {
      setLoadingCalculo(false);
    }
  };

  const handleCrear = async (
    payload: CrearPermiso,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await permisosService.crearPermiso(payload);
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
        message: formatError(err, "Error al registrar el permiso"),
      };
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleActualizar = async (
    payload: ActualizarPermiso,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await permisosService.actualizarPermiso(payload);
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
        message: formatError(err, "Error al actualizar el permiso"),
      };
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancelar = async (
    payload: CancelarPermiso,
  ): Promise<{ success: boolean; message: string }> => {
    setLoadingSubmit(true);
    try {
      const res = await permisosService.cancelarPermiso(payload);
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
        message: formatError(err, "Error al cancelar el permiso"),
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
    calculoTiempo,
    loadingCalculo,
    loadingSubmit,
    error,
    fetchDatosIniciales,
    fetchHistorial,
    handleCalcularTiempo,
    handleCrear,
    handleActualizar,
    handleCancelar,
    setCalculoTiempo,
  };
};
