export interface GpsLocationResult {
  latitud: number;
  longitud: number;
  accuracy: number;
}

export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en metros
  return d;
}

export const locationService = {
  obtenerUbicacionAntiTrampa: (
    onProgress?: (segs: number) => void
  ): Promise<GpsLocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Tu navegador o dispositivo no soporta geolocalización GPS.",
          ),
        );
        return;
      }

      const points: Array<GpsLocationResult & { timestamp: number }> = [];
      let rejected = false;
      let segsLeft = 10;
      
      if (onProgress) onProgress(segsLeft);

      const intervalId = window.setInterval(() => {
        segsLeft--;
        if (onProgress && segsLeft >= 0) onProgress(segsLeft);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (rejected) return;
            points.push({
              latitud: position.coords.latitude,
              longitud: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now(),
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 4000 },
        );
      }, 1000);

      setTimeout(() => {
        if (rejected) return;
        window.clearInterval(intervalId);

        if (points.length === 0) {
          reject(
            new Error(
              "No se pudo obtener la ubicación GPS tras analizar la señal.",
            ),
          );
          return;
        }

        //Analizamos la velocidad promedio de los ultimos puntos
        if (points.length > 1) {
          for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const distMeters = getDistanceFromLatLonInMeters(
              p1.latitud, p1.longitud, p2.latitud, p2.longitud,
            );
            const timeDiffSecs = (p2.timestamp - p1.timestamp) / 1000;
            // Solo analizamos la velocidad si hubo un movimiento mayor a 20 metros (para ignorar ruido pequeño)
            if (timeDiffSecs > 0 && distMeters > 20) {
              const speedMetersPerSec = distMeters / timeDiffSecs;
              const speedKmh = speedMetersPerSec * 3.6;
              // OJO: VELOCIDAD MAXIMA. Súbele el número si está saltando mucho en tu empresa real.
              const MAX_SPEED_KMH = 100; 
              if (speedKmh > MAX_SPEED_KMH) {
                rejected = true;
                reject(new Error("Se detectó una anomalía en el GPS. Por favor desactiva cualquier Fake GPS."));
                return;
              }
            }
          }

          //Analizamos si el usuario no se ha movido mucho efecto ping-pong
          if (points.length >= 4) {
            let totalPath = 0;
            for (let i = 1; i < points.length; i++) {
              totalPath += getDistanceFromLatLonInMeters(
                points[i - 1].latitud, points[i - 1].longitud,
                points[i].latitud, points[i].longitud
              );
            }
            const netDistance = getDistanceFromLatLonInMeters(
              points[0].latitud, points[0].longitud,
              points[points.length - 1].latitud, points[points.length - 1].longitud
            );
            // Súbele el totalPath a 100 y bájale la netDistance si está muy estricto.
            const MIN_PATH_METERS = 100;
            const MAX_NET_METERS = 15;
            if (totalPath > MIN_PATH_METERS && netDistance < MAX_NET_METERS) {
              rejected = true;
              reject(new Error("Se detectó inestabilidad GPS. Por favor desactiva cualquier Fake GPS."));
              return;
            }
          }
          
        }
        const lastPoint = points[points.length - 1];
        resolve({
          latitud: lastPoint.latitud,
          longitud: lastPoint.longitud,
          accuracy: lastPoint.accuracy,
        });
      }, 10000);
    });
  },
  obtenerUbicacionActual: (): Promise<GpsLocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Tu navegador o dispositivo no soporta geolocalización GPS.",
          ),
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let mensaje = "No se pudo obtener la ubicación GPS.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              mensaje =
                "Permiso de ubicación denegado. Para activarlo, toca el ícono del candado en la barra de direcciones, entra a 'Permisos', permite la Ubicación y recarga la página.";
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje =
                "Información de ubicación no disponible. Verifica que tu GPS esté encendido.";
              break;
            case error.TIMEOUT:
              mensaje = "Tiempo de espera agotado al consultar el GPS.";
              break;
          }
          reject(new Error(mensaje));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 15000,
        },
      );
    });
  },
  seguirUbicacionActual: (
    onSuccess: (loc: GpsLocationResult) => void,
    onError: (err: Error) => void,
  ): number | null => {
    if (!navigator.geolocation) {
      onError(
        new Error("Tu navegador o dispositivo no soporta geolocalización GPS."),
      );
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let mensaje = "No se pudo obtener la ubicación GPS.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje =
              "Permiso de ubicación denegado. Para activarlo, toca el ícono del candado en la barra de direcciones, permite la Ubicación y recarga.";
            break;
          case error.POSITION_UNAVAILABLE:
            mensaje =
              "Información de ubicación no disponible. Verifica que tu GPS esté encendido.";
            break;
          case error.TIMEOUT:
            mensaje = "Tiempo de espera agotado al consultar el GPS.";
            break;
        }
        onError(new Error(mensaje));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 15000,
      },
    );
  },
  iniciarMonitoreoContinuoAntiTrampa: (
    onAnomalyDetected: (mensaje: string) => void,
  ): number | null => {
    if (!navigator.geolocation) return null;

    const points: Array<GpsLocationResult & { timestamp: number }> = [];
    const intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const now = Date.now();
          points.push({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: now,
          });
          
          if (points.length > 5) points.shift();

          if (points.length > 1) {
            // 1. Detección de saltos bruscos (Rubber-banding) estrictamente
            const p1 = points[points.length - 2];
            const p2 = points[points.length - 1];
            const distMeters = getDistanceFromLatLonInMeters(
              p1.latitud,
              p1.longitud,
              p2.latitud,
              p2.longitud,
            );
            const timeDiffSecs = (p2.timestamp - p1.timestamp) / 1000;

            // Solo analizamos velocidad si el salto fue mayor a 20 metros
            if (timeDiffSecs > 0 && distMeters > 20) {
              const speedMetersPerSec = distMeters / timeDiffSecs;
              const speedKmh = speedMetersPerSec * 3.6;
              
              // 100 km/h es imposible para una persona. Si salta así de rápido, es Fake GPS seguro.
              if (speedKmh > 100) {
                onAnomalyDetected(
                  "Alerta de Seguridad: Se ha detectado un salto GPS malicioso (Fake GPS). Tu sesión será cerrada.",
                );
                return;
              }
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
      );
    }, 1000);

    return intervalId as unknown as number;
  },
  detenerSeguimiento: (watchId: number) => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
  detenerMonitoreoAntiTrampa: (intervalId: number) => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
    }
  },
};
