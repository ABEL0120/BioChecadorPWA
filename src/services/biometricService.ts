import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

export const biometricService = {
  isSupported: (): boolean => {
    return browserSupportsWebAuthn();
  },

  isPlatformAvailable: async (): Promise<boolean> => {
    if (!browserSupportsWebAuthn()) return false;
    return await platformAuthenticatorIsAvailable();
  },

  startRegistration: async (optionsJSON: any) => {
    return await startRegistration({ optionsJSON });
  },

  startAuthentication: async (optionsJSON: any) => {
    return await startAuthentication({ optionsJSON });
  },
};
