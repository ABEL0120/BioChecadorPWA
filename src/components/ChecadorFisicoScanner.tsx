import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { IonIcon, IonSpinner } from "@ionic/react";
import {
  imageOutline,
  alertCircleOutline,
  refreshOutline,
} from "ionicons/icons";
import { extraerTokenChecadorFisico } from "../utils/checadorFisicoHelper";
import { decodeQrTokenFromImageFile } from "../utils/qrImageScanner";

interface Props {
  onScanSuccess: (token: string) => void;
  disabled?: boolean;
}

export const ChecadorFisicoScanner: React.FC<Props> = ({
  onScanSuccess,
  disabled = false,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "checador-fisico-qr-reader";
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageScanError, setImageScanError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [isScanningImage, setIsScanningImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannedLockRef = useRef<boolean>(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const stopCameraScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
  }, []);

  const startCameraScanner = useCallback(
    async (isMountedCheck?: () => boolean) => {
      try {
        await stopCameraScanner();
        setIsInitializing(true);
        setCameraError(null);
        scannedLockRef.current = false;

        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (scannedLockRef.current || disabled) return;
            const token = extraerTokenChecadorFisico(decodedText);
            if (token) {
              scannedLockRef.current = true;
              if (navigator.vibrate) {
                try {
                  navigator.vibrate(150);
                } catch {}
              }
              stopCameraScanner().finally(() => {
                onScanSuccessRef.current(token);
              });
            }
          },
          () => {},
        );

        if (!isMountedCheck || isMountedCheck()) {
          setIsScanningActive(true);
          setIsInitializing(false);
        }
      } catch (err: any) {
        if (!isMountedCheck || isMountedCheck()) {
          setIsInitializing(false);
          setIsScanningActive(false);
          const msg =
            err?.message ||
            "No se pudo acceder a la cámara. Verifica los permisos en tu navegador.";
          setCameraError(msg);
        }
      }
    },
    [disabled, stopCameraScanner],
  );

  useEffect(() => {
    let isMounted = true;
    startCameraScanner(() => isMounted);

    return () => {
      isMounted = false;
      stopCameraScanner();
    };
  }, [startCameraScanner, stopCameraScanner]);

  const handleRetryCamera = () => {
    startCameraScanner();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageScanError(null);
    setIsScanningImage(true);

    try {
      const token = await decodeQrTokenFromImageFile(file);
      if (token) {
        scannedLockRef.current = true;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(150);
          } catch {}
        }
        await stopCameraScanner();
        onScanSuccess(token);
      } else {
        setImageScanError(
          "No se detectó un código QR válido en la imagen. Acerca o enfoca mejor el código e inténtalo de nuevo.",
        );
      }
    } catch {
      setImageScanError(
        "No se pudo procesar la imagen seleccionada. Intenta con otra captura o foto.",
      );
    } finally {
      setIsScanningImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border-4 border-slate-800">
        <div
          id={containerId}
          className="w-full h-full flex items-center justify-center overflow-hidden"
        />

        {isInitializing && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-3 z-10">
            <IonSpinner name="crescent" className="w-10 h-10 text-blue-500" />
            <p className="text-xs font-bold tracking-wider uppercase text-slate-300">
              Iniciando cámara...
            </p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <IonIcon
              icon={alertCircleOutline}
              className="text-red-400 text-5xl mb-2"
            />
            <p className="text-white text-sm font-bold mb-1">
              Acceso a la cámara bloqueado
            </p>
            <p className="text-slate-400 text-xs mb-4">{cameraError}</p>
            <button
              onClick={handleRetryCamera}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              <IonIcon icon={refreshOutline} className="text-base" />
              Reintentar
            </button>
          </div>
        )}

        {isScanningActive && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56 border-2 border-dashed border-blue-400/70 rounded-2xl">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-cyan-400/50" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-[340px]">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          disabled={disabled || isScanningImage}
          onClick={() => {
            setImageScanError(null);
            fileInputRef.current?.click();
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-60"
        >
          {isScanningImage ? (
            <IonSpinner name="crescent" className="w-4 h-4 text-blue-600" />
          ) : (
            <IonIcon icon={imageOutline} className="text-base text-blue-600" />
          )}
          <span>{isScanningImage ? "Analizando imagen..." : "Escanear Imagen"}</span>
        </button>

        {imageScanError && (
          <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
            <IonIcon
              icon={alertCircleOutline}
              className="text-base shrink-0 mt-0.5 text-red-500"
            />
            <span>{imageScanError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

