import React, { useCallback, useEffect, useState } from "react";
import { ModalInstalarApp } from "../components/ModalInstalarApp";
import { PwaInstallContext, PwaPlatform } from "./pwaInstallContextDef";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

const HINT_DISMISSED_KEY = "reloj_nomina_pwa_hint_dismissed";

const detectPlatform = (): PwaPlatform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const isIosDevice =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  if (isIosDevice) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
};

const checkStandaloneMode = (): boolean => {
  if (typeof window === "undefined") return false;
  const standaloneMatch = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const fullscreenMatch = window.matchMedia(
    "(display-mode: fullscreen)",
  ).matches;
  const minimalUiMatch = window.matchMedia(
    "(display-mode: minimal-ui)",
  ).matches;
  const navigatorStandalone =
    (navigator as NavigatorStandalone).standalone === true;
  const androidAppReferrer = document.referrer.includes("android-app://");
  const pwaParam =
    new URLSearchParams(window.location.search).get("mode") === "pwa";

  return (
    standaloneMatch ||
    fullscreenMatch ||
    minimalUiMatch ||
    navigatorStandalone ||
    androidAppReferrer ||
    pwaParam
  );
};

export const PwaInstallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [platform] = useState<PwaPlatform>(detectPlatform);
  const [isStandalone, setIsStandalone] =
    useState<boolean>(checkStandaloneMode);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(HINT_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = () => {
      setIsStandalone(checkStandaloneMode());
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setIsStandalone(checkStandaloneMode());
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(handleDisplayModeChange);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      } else if (typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const openInstallModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeInstallModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    try {
      window.localStorage.setItem(HINT_DISMISSED_KEY, "1");
    } catch {
      return;
    }
  }, []);

  const triggerNativeInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setInstallSuccess(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return (
    <PwaInstallContext.Provider
      value={{
        isStandalone,
        platform,
        canPromptNatively: Boolean(deferredPrompt),
        installSuccess,
        hintDismissed,
        openInstallModal,
        closeInstallModal,
        dismissHint,
        triggerNativeInstall,
      }}
    >
      {children}
      <ModalInstalarApp isOpen={modalOpen} onClose={closeInstallModal} />
    </PwaInstallContext.Provider>
  );
};
