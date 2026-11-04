import localforage from "localforage";
import { MarcarAsistenciaRequest } from "../types/api";
import { timeService } from "./timeService";

const PENDING_PUNCHES_KEY = "pending_punches";

export interface PendingPunch extends MarcarAsistenciaRequest {
  id: number;
  timestamp: number;
}

const offlineStore = localforage.createInstance({
  name: "BioChecadorPWA",
  storeName: "offline_sync",
});

export const offlineSyncService = {
  guardarChecadaLocal: async (
    punch: MarcarAsistenciaRequest,
  ): Promise<void> => {
    const fecha = punch.fechaHora || timeService.nowIsoLocal();
    const newPunch: PendingPunch = {
      ...punch,
      fechaHora: fecha,
      FechaHora: fecha,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    };

    let existing: PendingPunch[] = [];
    try {
      existing =
        (await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY)) || [];
    } catch {
      try {
        const raw = localStorage.getItem(PENDING_PUNCHES_KEY);
        existing = raw ? JSON.parse(raw) : [];
      } catch {}
    }

    if (!existing || !Array.isArray(existing)) {
      existing = [];
    }

    existing.push(newPunch);

    try {
      await offlineStore.setItem(PENDING_PUNCHES_KEY, existing);
    } catch {}

    try {
      localStorage.setItem(PENDING_PUNCHES_KEY, JSON.stringify(existing));
    } catch {}
  },

  obtenerChecadasPendientes: async (): Promise<PendingPunch[]> => {
    try {
      const items =
        await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY);
      if (items && Array.isArray(items) && items.length > 0) {
        return items;
      }
    } catch {}

    try {
      const raw = localStorage.getItem(PENDING_PUNCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    return [];
  },

  eliminarChecada: async (id: number): Promise<void> => {
    let existing: PendingPunch[] = [];
    try {
      existing =
        (await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY)) || [];
    } catch {
      try {
        const raw = localStorage.getItem(PENDING_PUNCHES_KEY);
        existing = raw ? JSON.parse(raw) : [];
      } catch {}
    }

    if (!existing || !Array.isArray(existing)) {
      existing = [];
    }

    const filtered = existing.filter((punch) => punch.id !== id);

    try {
      await offlineStore.setItem(PENDING_PUNCHES_KEY, filtered);
    } catch {}

    try {
      localStorage.setItem(PENDING_PUNCHES_KEY, JSON.stringify(filtered));
    } catch {}
  },

  guardarConfiguracion: async (key: string, value: any): Promise<void> => {
    try {
      await offlineStore.setItem(key, value);
    } catch {}
    try {
      localStorage.setItem(`offline_cfg_${key}`, JSON.stringify(value));
    } catch {}
  },

  obtenerConfiguracion: async <T>(key: string): Promise<T | null> => {
    try {
      const val = await offlineStore.getItem<T>(key);
      if (val !== null && val !== undefined) return val;
    } catch {}
    try {
      const raw = localStorage.getItem(`offline_cfg_${key}`);
      if (raw !== null) return JSON.parse(raw);
    } catch {}
    return null;
  },
};
