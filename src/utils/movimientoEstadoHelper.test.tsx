import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import {
  esMismoDiaLocal,
  normalizarSesionPorDia,
  obtenerEstadoMovimientosHoy,
} from "./movimientoEstadoHelper";
import { timeService } from "../services/timeService";
import { EstadoEmpleadoDto } from "../types/api";
import { AuthSessionProvider, useAuthSession } from "../context/AuthSessionContext";
import { offlineSyncService } from "../services/offlineSyncService";

const baseEmpleado: EstadoEmpleadoDto = {
  existe: true,
  tieneBiometria: true,
  rfc: "LULF0308011Z0",
  nombre: "FERNANDO ABEL",
  ultimoMovimientoHoy: "SALIDA",
  tieneSalidaHoy: true,
  fechaGuardadoLocal: "2026-11-05",
};

const SessionProbe: React.FC = () => {
  const { user, isLoadingSession } = useAuthSession();
  if (isLoadingSession) return <div>loading</div>;
  return (
    <div>
      <span data-testid="ultimo">{user?.ultimoMovimientoHoy ?? ""}</span>
      <span data-testid="salida">{String(Boolean(user?.tieneSalidaHoy))}</span>
      <span data-testid="fecha">{user?.fechaGuardadoLocal ?? ""}</span>
    </div>
  );
};

describe("movimientoEstadoHelper y cambio de dia offline", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("resetea ultimoMovimientoHoy y tieneSalidaHoy cuando fechaGuardadoLocal es de un dia anterior", () => {
    vi.spyOn(timeService, "nowDateLocal").mockReturnValue("2026-11-06");

    const { empleadoNormalizado, cambioDeDia } =
      normalizarSesionPorDia(baseEmpleado);

    expect(cambioDeDia).toBe(true);
    expect(empleadoNormalizado.ultimoMovimientoHoy).toBe("");
    expect(empleadoNormalizado.tieneSalidaHoy).toBe(false);
    expect(empleadoNormalizado.fechaGuardadoLocal).toBe("2026-11-06");
  });

  it("conserva el movimiento y salida cuando fechaGuardadoLocal corresponde a hoy", () => {
    vi.spyOn(timeService, "nowDateLocal").mockReturnValue("2026-11-05");

    const { empleadoNormalizado, cambioDeDia } =
      normalizarSesionPorDia(baseEmpleado);
    const estadoHoy = obtenerEstadoMovimientosHoy(baseEmpleado);

    expect(cambioDeDia).toBe(false);
    expect(empleadoNormalizado.ultimoMovimientoHoy).toBe("SALIDA");
    expect(empleadoNormalizado.tieneSalidaHoy).toBe(true);
    expect(estadoHoy.ultimoMovimientoHoy).toBe("SALIDA");
    expect(estadoHoy.tieneSalidaHoy).toBe(true);
  });

  it("obtenerEstadoMovimientosHoy ignora tieneSalidaHoy si la sesion pertenece a otro dia", () => {
    vi.spyOn(timeService, "nowDateLocal").mockReturnValue("2026-11-06");

    const estadoHoy = obtenerEstadoMovimientosHoy(baseEmpleado);

    expect(estadoHoy.ultimoMovimientoHoy).toBe("");
    expect(estadoHoy.tieneSalidaHoy).toBe(false);
    expect(esMismoDiaLocal("2026-11-05T17:02:00")).toBe(false);
    expect(esMismoDiaLocal("2026-11-06T08:00:00")).toBe(true);
  });

  it("AuthSessionProvider limpia el estado de ayer al hidratar offline al dia siguiente", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    vi.spyOn(timeService, "nowDateLocal").mockReturnValue("2026-11-06");
    vi.spyOn(
      offlineSyncService,
      "obtenerChecadasPendientes",
    ).mockResolvedValue([]);

    localStorage.setItem("reloj_nomina_session", JSON.stringify(baseEmpleado));

    await act(async () => {
      render(
        <AuthSessionProvider>
          <SessionProbe />
        </AuthSessionProvider>,
      );
    });

    expect(screen.getByTestId("ultimo").textContent).toBe("");
    expect(screen.getByTestId("salida").textContent).toBe("false");
    expect(screen.getByTestId("fecha").textContent).toBe("2026-11-06");

    const persisted = JSON.parse(
      localStorage.getItem("reloj_nomina_session") || "{}",
    );
    expect(persisted.ultimoMovimientoHoy).toBe("");
    expect(persisted.tieneSalidaHoy).toBe(false);
    expect(persisted.fechaGuardadoLocal).toBe("2026-11-06");
  });

  it("AuthSessionProvider actualiza la UI al reanudar la app en modo offline en un dia nuevo", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    const dateSpy = vi
      .spyOn(timeService, "nowDateLocal")
      .mockReturnValue("2026-11-05");
    vi.spyOn(
      offlineSyncService,
      "obtenerChecadasPendientes",
    ).mockResolvedValue([]);

    localStorage.setItem("reloj_nomina_session", JSON.stringify(baseEmpleado));

    await act(async () => {
      render(
        <AuthSessionProvider>
          <SessionProbe />
        </AuthSessionProvider>,
      );
    });

    expect(screen.getByTestId("salida").textContent).toBe("true");
    expect(screen.getByTestId("ultimo").textContent).toBe("SALIDA");

    dateSpy.mockReturnValue("2026-11-06");
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByTestId("ultimo").textContent).toBe("");
    expect(screen.getByTestId("salida").textContent).toBe("false");
    expect(screen.getByTestId("fecha").textContent).toBe("2026-11-06");
  });
});
