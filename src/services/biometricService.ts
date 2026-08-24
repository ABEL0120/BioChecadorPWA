import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export interface BiometricEnrollmentResult {
  credentialId: string;
  publicKey: string;
  dispositivo: string;
  userAgent: string;
}

export interface BiometricAuthenticationResult {
  credentialId: string;
  dispositivo: string;
  userAgent: string;
}

const bufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS Device (Face ID / Touch ID)";
  if (/Android/.test(ua)) return "Android Device (Huella / Rostro)";
  if (/Macintosh/.test(ua)) return "Mac (Touch ID)";
  if (/Windows/.test(ua)) return "Windows Device (Windows Hello)";
  return "Dispositivo Biométrico Compatible";
};

export const biometricService = {
  getDeviceName,
  isSupported: (): boolean => {
    return browserSupportsWebAuthn();
  },

  isPlatformAvailable: async (): Promise<boolean> => {
    if (!browserSupportsWebAuthn()) return false;
    try {
      return await platformAuthenticatorIsAvailable();
    } catch {
      return false;
    }
  },

  enrolarBiometriaNativa: async (
    rfc: string,
    nombreEmpleado: string
  ): Promise<BiometricEnrollmentResult> => {
    if (!browserSupportsWebAuthn()) {
      throw new Error(
        "Este dispositivo o navegador no soporta autenticación biométrica WebAuthn."
      );
    }

    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    const challengeBase64 = bufferToBase64Url(randomBuffer.buffer);

    const userIdBytes = new TextEncoder().encode(rfc);
    const userIdBase64 = bufferToBase64Url(userIdBytes.buffer);

    const optionsJSON: any = {
      challenge: challengeBase64,
      rp: {
        name: "Reloj Nomina 2026",
        id: window.location.hostname,
      },
      user: {
        id: userIdBase64,
        name: rfc,
        displayName: nombreEmpleado || rfc,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };

    const registrationResponse = await startRegistration({ optionsJSON });

    const credentialId = registrationResponse.id;
    const publicKey =
      registrationResponse.response.publicKey ||
      registrationResponse.response.attestationObject;

    const dispositivo = getDeviceName();
    const userAgent = navigator.userAgent;

    return {
      credentialId,
      publicKey,
      dispositivo,
      userAgent,
    };
  },

  autenticarBiometriaNativa: async (
    rfc: string
  ): Promise<BiometricAuthenticationResult> => {
    if (!browserSupportsWebAuthn()) {
      throw new Error(
        "Este dispositivo no soporta verificación biométrica WebAuthn."
      );
    }

    const randomBuffer = new Uint8Array(32);
    crypto.getRandomValues(randomBuffer);
    const challengeBase64 = bufferToBase64Url(randomBuffer.buffer);

    const optionsJSON: any = {
      challenge: challengeBase64,
      timeout: 60000,
      userVerification: "preferred",
      rpId: window.location.hostname,
    };

    const authResponse = await startAuthentication({ optionsJSON });

    return {
      credentialId: authResponse.id,
      dispositivo: getDeviceName(),
      userAgent: navigator.userAgent,
    };
  },
};
