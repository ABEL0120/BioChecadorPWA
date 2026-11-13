import { createContext } from "react";

export type PwaPlatform = "android" | "ios" | "desktop";

export interface PwaInstallContextValue {
  isStandalone: boolean;
  platform: PwaPlatform;
  canPromptNatively: boolean;
  installSuccess: boolean;
  hintDismissed: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  dismissHint: () => void;
  triggerNativeInstall: () => Promise<boolean>;
}

export const PwaInstallContext = createContext<
  PwaInstallContextValue | undefined
>(undefined);

