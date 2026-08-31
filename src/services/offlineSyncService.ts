import localforage from "localforage";
import { MarcarAsistenciaRequest } from "../types/api";

const PENDING_PUNCHES_KEY = "pending_punches";

export interface PendingPunch extends MarcarAsistenciaRequest {
  id: number;
  timestamp: number;
}

// Configurar instancia específica para la aplicación
const offlineStore = localforage.createInstance({
  name: "BioChecadorPWA",
  storeName: "offline_sync"
});

export const offlineSyncService = {
  guardarChecadaLocal: async (punch: MarcarAsistenciaRequest): Promise<void> => {
    try {
      const existing = await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY) || [];
      const newPunch: PendingPunch = {
        ...punch,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      };
      
      existing.push(newPunch);
      await offlineStore.setItem(PENDING_PUNCHES_KEY, existing);
    } catch (error) {
      console.error("Error al guardar checada offline:", error);
      throw error;
    }
  },

  obtenerChecadasPendientes: async (): Promise<PendingPunch[]> => {
    try {
      return await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY) || [];
    } catch (error) {
      console.error("Error al obtener checadas offline:", error);
      return [];
    }
  },

  eliminarChecada: async (id: number): Promise<void> => {
    try {
      const existing = await offlineStore.getItem<PendingPunch[]>(PENDING_PUNCHES_KEY) || [];
      const filtered = existing.filter(punch => punch.id !== id);
      await offlineStore.setItem(PENDING_PUNCHES_KEY, filtered);
    } catch (error) {
      console.error("Error al eliminar checada offline:", error);
      throw error;
    }
  },

  // Funciones nuevas para guardar configuración (como el RFC autoguardado)
  guardarConfiguracion: async (key: string, value: any): Promise<void> => {
    try {
      await offlineStore.setItem(key, value);
    } catch (error) {
      console.error(`Error guardando configuracion ${key}:`, error);
    }
  },

  obtenerConfiguracion: async <T>(key: string): Promise<T | null> => {
    try {
      return await offlineStore.getItem<T>(key);
    } catch (error) {
      console.error(`Error obteniendo configuracion ${key}:`, error);
      return null;
    }
  }
};
