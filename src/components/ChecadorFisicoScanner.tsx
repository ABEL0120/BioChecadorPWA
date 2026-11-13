import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { IonIcon, IonSpinner } from "@ionic/react";
import {
  cameraOutline,
  imageOutline,
  keypadOutline,
  alertCircleOutline,
  flashOutline,
  refreshOutline,
} from "ionicons/icons";
import { extraerTokenChecadorFisico } from "../utils/checadorFisicoHelper";

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
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannedLockRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        setIsInitializing(true);
        setCameraError(null);
        scannedLockRef.current = false;

        const scanner = new Html5Qrcode(containerId);
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
              stopScanner().finally(() => {
                onScanSuccess(token);
              });
            }
          },
          () => {}
        );

        if (isMounted) {
          setIsScanningActive(true);
          setIsInitializing(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsInitializing(false);
          setIsScanningActive(false);
          const msg =
            err?.message ||
            "No se pudo acceder a la cámara. Verifica los permisos en tu navegador.";
          setCameraError(msg);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [disabled]);

  const handleRetryCamera = () => {
    setCameraError(null);
    setIsInitializing(true);
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    scannedLockRef.current = false;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
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
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                scannerRef.current = null;
                onScanSuccess(token);
              });
            } else {
              onScanSuccess(token);
            }
          }
        },
        () => {}
      )
      .then(() => {
        setIsScanningActive(true);
        setIsInitializing(false);
      })
      .catch((err: any) => {
        setIsInitializing(false);
        setIsScanningActive(false);
        setCameraError(
          err?.message || "No se pudo acceder a la cámara. Revisa permisos."
        );
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
      }
      if (scanner.isScanning) {
        await scanner.stop();
      }
      const decodedText = await scanner.scanFile(file, false);
      const token = extraerTokenChecadorFisico(decodedText);
      if (token) {
        onScanSuccess(token);
      }
    } catch {
      alert("No se pudo detectar un código QR en la imagen seleccionada.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extraerTokenChecadorFisico(manualToken);
    if (!token) return;
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    onScanSuccess(token);
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

      <div className="flex items-center gap-3 mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
        >
          <IonIcon icon={imageOutline} className="text-base text-blue-600" />
          <span>Escanear Imagen</span>
        </button>

        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
        >
          <IonIcon icon={keypadOutline} className="text-base text-indigo-600" />
          <span>{showManualInput ? "Ocultar Código" : "Ingresar Token"}</span>
        </button>
      </div>

      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="w-full max-w-[340px] mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3"
        >
          <label className="text-xs font-bold text-slate-700">
            Ingreso manual del Token
          </label>
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Pega el token o URL del QR"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!manualToken.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Continuar con Token
          </button>
        </form>
      )}
    </div>
  );
};

