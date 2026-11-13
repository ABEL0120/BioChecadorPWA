import { useContext } from "react";
import { PwaInstallContext } from "../context/pwaInstallContextDef";

export const usePwaInstall = () => {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error(
      "usePwaInstall debe utilizarse dentro de PwaInstallProvider.",
    );
  }
  return ctx;
};

