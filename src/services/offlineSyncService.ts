import { MarcarAsistenciaRequest } from "../types/api";

const DB_NAME = "RelojNominaDB";
const DB_VERSION = 1;
const STORE_NAME = "pending_punches";

export interface PendingPunch extends MarcarAsistenciaRequest {
  id?: number;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
};

export const offlineSyncService = {
  guardarChecadaLocal: async (
    punch: MarcarAsistenciaRequest,
  ): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const pendingPunch: PendingPunch = {
        ...punch,
        timestamp: Date.now(),
      };

      const request = store.add(pendingPunch);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  obtenerChecadasPendientes: async (): Promise<PendingPunch[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  eliminarChecada: async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
