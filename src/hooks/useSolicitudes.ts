import { useState, useEffect } from "react";
import { useAuthSession } from "../context/AuthSessionContext";
import { checadorApi } from "../api/checadorApi";
import { formatError } from "../utils/errorHandler";
import { biometricService } from "../services/biometricService";

export const useSolicitudes = () => {
  const { user } = useAuthSession();
  const [motivoSolicitud, setMotivoSolicitud] = useState<string>("");
  const [enviandoSolicitud, setEnviandoSolicitud] = useState<boolean>(false);
  const [hasPending, setHasPending] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [alertInfo, setAlertInfo] = useState<{ show: boolean; header: string; message: string; color?: string } | null>(null);
  const [toastInfo, setToastInfo] = useState<{ show: boolean; message: string; color: string } | null>(null);

  useEffect(() => {
    const checkEstatus = async () => {
      if (!user || !user.rfc) return;
      setLoadingStatus(true);
      try {
        const resp = await checadorApi.consultarEstatusSolicitud(
          user.rfc,
          user.numeroCompania || 0
        );
        setHasPending(!resp.success);
      } catch (err: unknown) {
        setHasPending(false);
      } finally {
        setLoadingStatus(false);
      }
    };
    checkEstatus();
  }, [user]);

  const enviarSolicitudReinicio = async () => {
    if (!motivoSolicitud.trim()) {
      setToastInfo({
        show: true,
        message: "Por favor, ingresa un motivo válido.",
        color: "warning",
      });
      return;
    }
    if (!user || !user.rfc) return;

    setEnviandoSolicitud(true);
    try {
      const resp = await checadorApi.enviarSolicitud({
        rfc: user.rfc,
        numeroCompania: user.numeroCompania || 0,
        motivo: motivoSolicitud.trim(),
        tipoDispositivo: biometricService.getDeviceName(),
      });

      if (resp.success) {
        localStorage.setItem(
          `solicitud_pendiente_${user.rfc}`,
          Date.now().toString()
        );
        setMotivoSolicitud("");
        setHasPending(true);
        setAlertInfo({
          show: true,
          header: "Solicitud Enviada",
          message:
            "Tu solicitud ha sido enviada al administrador. Una vez aprobada, podrás registrar tu nueva huella.",
        });
      } else {
        if (
          resp.message?.includes("Ya existe una solicitud pendiente") ||
          resp.message?.includes("Ya cuentas con una solicitud pendiente")
        ) {
          localStorage.setItem(
            `solicitud_pendiente_${user.rfc}`,
            Date.now().toString()
          );
          setHasPending(true);
        }
        setAlertInfo({
          show: true,
          header: "Aviso",
          message: resp.message || "Ocurrió un error al enviar la solicitud.",
        });
      }
    } catch (err: unknown) {
      setAlertInfo({
        show: true,
        header: "Error",
        message: formatError(err, "Error al conectar con el servidor."),
      });
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const closeAlert = () => setAlertInfo(null);
  const closeToast = () => setToastInfo(null);

  return {
    user,
    motivoSolicitud,
    setMotivoSolicitud,
    enviandoSolicitud,
    hasPending,
    loadingStatus,
    enviarSolicitudReinicio,
    alertInfo,
    closeAlert,
    toastInfo,
    closeToast,
  };
};
