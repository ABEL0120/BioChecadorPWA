import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { ChecadorFisicoPasskeyPayload } from "../types/api";

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

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64UrlToBase64 = (str: string): string => {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
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

    const userIdBytes = new TextEncoder().encode(rfc);

    try {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: randomBuffer,
          rp: {
            name: "Reloj Nomina 2026",
            id: window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: rfc,
            displayName: nombreEmpleado || rfc,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            userVerification: "preferred",
            residentKey: "required",
            requireResidentKey: true,
          },
          timeout: 60000,
          attestation: "none",
        },
      })) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error("No se pudo generar la credencial biométrica.");
      }

      const credentialResponse = credential.response as AuthenticatorAttestationResponse;
      let publicKeyBase64 = "";

      if (typeof credentialResponse.getPublicKey === "function") {
        const spkiDer = credentialResponse.getPublicKey();
        if (spkiDer) {
          publicKeyBase64 = bufferToBase64(spkiDer);
        }
      }

      if (!publicKeyBase64 && credentialResponse.attestationObject) {
        publicKeyBase64 = bufferToBase64(credentialResponse.attestationObject);
      }

      return {
        credentialId: credential.id,
        publicKey: publicKeyBase64,
        dispositivo: getDeviceName(),
        userAgent: navigator.userAgent,
      };
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        throw err;
      }

      const challengeBase64 = bufferToBase64Url(randomBuffer.buffer);
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
          residentKey: "required",
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: "none",
      };

      const registrationResponse = await startRegistration({ optionsJSON });

      const credentialId = registrationResponse.id;
      const rawPublicKey =
        registrationResponse.response.publicKey ||
        registrationResponse.response.attestationObject;

      const publicKey = rawPublicKey ? base64UrlToBase64(rawPublicKey) : "";

      return {
        credentialId,
        publicKey,
        dispositivo: getDeviceName(),
        userAgent: navigator.userAgent,
      };
    }
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

  obtenerAsercionChecadorFisico: async (
    tokenChecadorFisico: string
  ): Promise<ChecadorFisicoPasskeyPayload> => {
    if (!browserSupportsWebAuthn()) {
      throw new Error(
        "Este dispositivo o navegador no soporta autenticación biométrica WebAuthn."
      );
    }

    const challengeBytes = new TextEncoder().encode(tokenChecadorFisico);

    const credential = (await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes,
        rpId: window.location.hostname,
        allowCredentials: [],
        userVerification: "preferred",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error("No se obtuvo credencial biométrica.");
    }

    const authResponse = credential.response as AuthenticatorAssertionResponse;

    return {
      id: credential.id,
      rawId: bufferToBase64Url(credential.rawId),
      type: "public-key",
      response: {
        authenticatorData: bufferToBase64Url(authResponse.authenticatorData),
        clientDataJSON: bufferToBase64Url(authResponse.clientDataJSON),
        signature: bufferToBase64Url(authResponse.signature),
        userHandle: authResponse.userHandle
          ? bufferToBase64Url(authResponse.userHandle)
          : null,
      },
    };
  },
};
