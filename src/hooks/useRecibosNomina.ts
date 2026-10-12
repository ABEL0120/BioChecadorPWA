import { useState, useCallback } from "react";
import { nominaService, ReciboNomina } from "../services/nominaService";
import { formatError } from "../utils/errorHandler";

export const useRecibosNomina = () => {
  const [recibos, setRecibos] = useState<ReciboNomina[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecibos = useCallback(
    async (
      compania: number,
      m103: number,
      fechaInicial?: string,
      fechaFinal?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await nominaService.obtenerRecibos(
          compania,
          m103,
          fechaInicial,
          fechaFinal
        );
        if (res.success) {
          setRecibos(res.data || []);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(formatError(err, "Error al obtener los recibos de nómina"));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const descargarArchivo = async (
    anio: number,
    proceso: number,
    tipo: "pdf" | "xml",
    archivo: string
  ): Promise<{ success: boolean; message?: string }> => {
    const key = `${anio}_${proceso}_${tipo}_${archivo}`;
    setDownloadingKey(key);
    try {
      const blobData = await nominaService.descargarArchivo(
        anio,
        proceso,
        tipo,
        archivo
      );

      const mimeType = tipo === "xml" ? "application/xml" : "application/pdf";
      const blob = new Blob([blobData], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${archivo}.${tipo}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: formatError(err, `Error al descargar el archivo ${tipo.toUpperCase()}`),
      };
    } finally {
      setDownloadingKey(null);
    }
  };

  return {
    recibos,
    loading,
    downloadingKey,
    error,
    fetchRecibos,
    descargarArchivo,
  };
};
