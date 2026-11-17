import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { extraerTokenChecadorFisico } from "./checadorFisicoHelper";

interface DetectedBarcode {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
}

const getNativeQrDetector = async (): Promise<BarcodeDetectorInstance | null> => {
  const Ctor = (
    globalThis as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
  ).BarcodeDetector;
  if (!Ctor) return null;
  try {
    if (typeof Ctor.getSupportedFormats === "function") {
      const supported = await Ctor.getSupportedFormats();
      if (!supported.includes("qr_code")) return null;
    }
    return new Ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
};

const detectWithNative = async (
  detector: BarcodeDetectorInstance | null,
  source: ImageBitmapSource,
): Promise<string | null> => {
  if (!detector) return null;
  try {
    const results = await detector.detect(source);
    for (const item of results) {
      const token = extraerTokenChecadorFisico(item.rawValue || "");
      if (token) return token;
    }
  } catch {}
  return null;
};

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });

const canvasToPngFile = (
  canvas: HTMLCanvasElement,
  name: string,
): Promise<File | null> =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob ? new File([blob], name, { type: "image/png" }) : null);
      },
      "image/png",
      1,
    );
  });

interface CanvasVariantOptions {
  maxDimension: number;
  padding: number;
  cropRatio?: number;
  smoothing?: boolean;
  filterMode?: "none" | "contrast" | "threshold" | "invert";
}

const buildCanvasVariant = (
  img: HTMLImageElement,
  options: CanvasVariantOptions,
): HTMLCanvasElement | null => {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) return null;

  const cropRatio = options.cropRatio ?? 1;
  const srcW = Math.max(1, Math.round(naturalW * cropRatio));
  const srcH = Math.max(1, Math.round(naturalH * cropRatio));
  const srcX = Math.round((naturalW - srcW) / 2);
  const srcY = Math.round((naturalH - srcH) / 2);

  const longest = Math.max(srcW, srcH);
  const scale =
    longest > options.maxDimension ? options.maxDimension / longest : 1;
  const drawW = Math.max(1, Math.round(srcW * scale));
  const drawH = Math.max(1, Math.round(srcH * scale));
  const pad = options.padding;

  const canvas = document.createElement("canvas");
  canvas.width = drawW + pad * 2;
  canvas.height = drawH + pad * 2;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = options.smoothing ?? true;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, pad, pad, drawW, drawH);

  const mode = options.filterMode ?? "none";
  if (mode !== "none") {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minLum = 255;
    let maxLum = 0;
    if (mode === "contrast" || mode === "threshold") {
      for (let i = 0; i < data.length; i += 4) {
        const lum =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }
    }

    const range = Math.max(1, maxLum - minLum);
    const threshold = minLum + range * 0.5;

    for (let i = 0; i < data.length; i += 4) {
      if (mode === "invert") {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      } else {
        const lum =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (mode === "contrast") {
          const stretched = Math.max(
            0,
            Math.min(255, ((lum - minLum) / range) * 255),
          );
          data[i] = stretched;
          data[i + 1] = stretched;
          data[i + 2] = stretched;
        } else {
          const bw = lum >= threshold ? 255 : 0;
          data[i] = bw;
          data[i + 1] = bw;
          data[i + 2] = bw;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
};

const scanFileWithHtml5Qrcode = async (
  scanner: Html5Qrcode,
  file: File,
): Promise<string | null> => {
  try {
    const decodedText = await scanner.scanFile(file, false);
    const token = extraerTokenChecadorFisico(decodedText);
    return token || null;
  } catch {
    return null;
  }
};

export const decodeQrTokenFromImageFile = async (
  file: File,
): Promise<string | null> => {
  const detector = await getNativeQrDetector();

  if (detector && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const nativeToken = await detectWithNative(detector, bitmap);
        if (nativeToken) return nativeToken;
      } finally {
        bitmap.close?.();
      }
    } catch {}
  }

  const tempId = `qr-file-decoder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tempContainer = document.createElement("div");
  tempContainer.id = tempId;
  tempContainer.style.position = "fixed";
  tempContainer.style.left = "-99999px";
  tempContainer.style.top = "-99999px";
  tempContainer.style.width = "1px";
  tempContainer.style.height = "1px";
  tempContainer.style.overflow = "hidden";
  tempContainer.style.opacity = "0";
  tempContainer.style.pointerEvents = "none";
  document.body.appendChild(tempContainer);

  const fileScanner = new Html5Qrcode(tempId, {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    useBarCodeDetectorIfSupported: true,
    verbose: false,
  });

  try {
    const rawToken = await scanFileWithHtml5Qrcode(fileScanner, file);
    if (rawToken) return rawToken;

    let img: HTMLImageElement | null = null;
    try {
      img = await loadImageElement(file);
    } catch {
      return null;
    }

    const variants: CanvasVariantOptions[] = [
      { maxDimension: 1200, padding: 36, smoothing: true, filterMode: "none" },
      { maxDimension: 720, padding: 28, smoothing: false, filterMode: "none" },
      {
        maxDimension: 960,
        padding: 36,
        smoothing: true,
        filterMode: "contrast",
      },
      {
        maxDimension: 960,
        padding: 36,
        smoothing: false,
        filterMode: "threshold",
      },
      {
        maxDimension: 960,
        padding: 36,
        cropRatio: 0.65,
        smoothing: true,
        filterMode: "contrast",
      },
      {
        maxDimension: 960,
        padding: 36,
        smoothing: true,
        filterMode: "invert",
      },
    ];

    for (let i = 0; i < variants.length; i++) {
      const canvas = buildCanvasVariant(img, variants[i]);
      if (!canvas) continue;

      const nativeCanvasToken = await detectWithNative(detector, canvas);
      if (nativeCanvasToken) return nativeCanvasToken;

      const variantFile = await canvasToPngFile(canvas, `qr-pass-${i}.png`);
      if (!variantFile) continue;

      const zxingToken = await scanFileWithHtml5Qrcode(fileScanner, variantFile);
      if (zxingToken) return zxingToken;
    }

    return null;
  } finally {
    try {
      fileScanner.clear();
    } catch {}
    tempContainer.remove();
  }
};
