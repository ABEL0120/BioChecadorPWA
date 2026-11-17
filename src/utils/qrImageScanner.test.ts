import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { decodeQrTokenFromImageFile } from "./qrImageScanner";

const scanFileMock = vi.fn();
const clearMock = vi.fn();

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    scanFile: scanFileMock,
    clear: clearMock,
  })),
  Html5QrcodeSupportedFormats: {
    QR_CODE: 0,
  },
}));

describe("decodeQrTokenFromImageFile", () => {
  const originalBarcodeDetector = (globalThis as any).BarcodeDetector;
  const originalCreateImageBitmap = (globalThis as any).createImageBitmap;

  beforeEach(() => {
    scanFileMock.mockReset();
    clearMock.mockReset();
    delete (globalThis as any).BarcodeDetector;
    delete (globalThis as any).createImageBitmap;
  });

  afterEach(() => {
    if (originalBarcodeDetector !== undefined) {
      (globalThis as any).BarcodeDetector = originalBarcodeDetector;
    } else {
      delete (globalThis as any).BarcodeDetector;
    }
    if (originalCreateImageBitmap !== undefined) {
      (globalThis as any).createImageBitmap = originalCreateImageBitmap;
    } else {
      delete (globalThis as any).createImageBitmap;
    }
  });

  it("decodifica token con BarcodeDetector nativo cuando esta disponible", async () => {
    const closeMock = vi.fn();
    (globalThis as any).createImageBitmap = vi
      .fn()
      .mockResolvedValue({ close: closeMock });
    (globalThis as any).BarcodeDetector = class {
      static async getSupportedFormats() {
        return ["qr_code"];
      }
      async detect() {
        return [{ rawValue: "https://app.test/checador-fisico?token=TOK_NATIVO" }];
      }
    };

    const file = new File(["qr"], "qr.png", { type: "image/png" });
    const result = await decodeQrTokenFromImageFile(file);

    expect(result).toBe("TOK_NATIVO");
    expect(closeMock).toHaveBeenCalled();
    expect(scanFileMock).not.toHaveBeenCalled();
  });

  it("hace fallback a Html5Qrcode cuando BarcodeDetector no detecta nada", async () => {
    scanFileMock.mockResolvedValueOnce(
      JSON.stringify({ tokenChecadorFisico: "TOK_ZXING" }),
    );

    const file = new File(["qr"], "qr.png", { type: "image/png" });
    const result = await decodeQrTokenFromImageFile(file);

    expect(result).toBe("TOK_ZXING");
    expect(scanFileMock).toHaveBeenCalledTimes(1);
    expect(clearMock).toHaveBeenCalled();
  });

  it("retorna null si la imagen no contiene un QR valido", async () => {
    scanFileMock.mockRejectedValue(new Error("No QR found"));

    const file = new File(["invalid"], "bad.png", { type: "image/png" });
    const result = await decodeQrTokenFromImageFile(file);

    expect(result).toBeNull();
    expect(clearMock).toHaveBeenCalled();
  });
});
