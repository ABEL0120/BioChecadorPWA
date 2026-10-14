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
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

const isWindows =
  typeof navigator !== "undefined" && /Windows/.test(navigator.userAgent);

let ultimaUbicacionConocida: GpsLocationResult | null = null;
let ultimaUbicacionTimestamp = 0;

function guardarUbicacion(pos: GeolocationPosition): GpsLocationResult {
  const res: GpsLocationResult = {
    latitud: pos.coords.latitude,
    longitud: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
  ultimaUbicacionConocida = res;
  ultimaUbicacionTimestamp = Date.now();
  return res;
}

export const locationService = {
  getUltimaUbicacionConocida: (): GpsLocationResult | null => {
    return ultimaUbicacionConocida;
  },

  obtenerUbicacionAntiTrampa: (
    onProgress?: (segs: number) => void,
  ): Promise<GpsLocationResult> => {
    return locationService.obtenerUbicacionActual();
  },

  obtenerUbicacionActual: (): Promise<GpsLocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        if (ultimaUbicacionConocida) {
          resolve(ultimaUbicacionConocida);
          return;
        }
        reject(
          new Error(
            "Tu navegador o dispositivo no soporta geolocalización GPS.",
          ),
        );
        return;
      }

      const ahora = Date.now();
      if (
        ultimaUbicacionConocida &&
        ahora - ultimaUbicacionTimestamp < 180000
      ) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(guardarUbicacion(position)),
          () => resolve(ultimaUbicacionConocida!),
          {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 60000,
          },
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(guardarUbicacion(position));
        },
        (error) => {
          if (ultimaUbicacionConocida) {
            resolve(ultimaUbicacionConocida);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (posFallback) => {
              resolve(guardarUbicacion(posFallback));
            },
            (errFallback) => {
              let mensaje = "No se pudo obtener la ubicación GPS.";
              switch (errFallback.code) {
                case errFallback.PERMISSION_DENIED:
                  mensaje =
                    "Permiso de ubicación denegado. Permite la Ubicación en los ajustes del sitio o navegador.";
                  break;
                case errFallback.POSITION_UNAVAILABLE:
                  mensaje =
                    "Información de ubicación no disponible. Verifica que tu GPS o red esté encendida.";
                  break;
                case errFallback.TIMEOUT:
                  mensaje = "Tiempo de espera agotado al consultar el GPS.";
                  break;
              }
              reject(new Error(mensaje));
            },
            {
              enableHighAccuracy: false,
              timeout: 6000,
              maximumAge: 30000,
            },
          );
        },
        {
          enableHighAccuracy: !isWindows,
          timeout: 8000,
          maximumAge: 30000,
        },
      );
    });
  },

  seguirUbicacionActual: (
    onSuccess: (loc: GpsLocationResult) => void,
    onError: (err: Error) => void,
  ): number | null => {
    if (!navigator.geolocation) {
      if (ultimaUbicacionConocida) {
        onSuccess(ultimaUbicacionConocida);
      } else {
        onError(
          new Error(
            "Tu navegador o dispositivo no soporta geolocalización GPS.",
          ),
        );
      }
      return null;
    }

    if (ultimaUbicacionConocida) {
      onSuccess(ultimaUbicacionConocida);
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        const res = guardarUbicacion(position);
        onSuccess(res);
      },
      (error) => {
        if (ultimaUbicacionConocida) {
          onSuccess(ultimaUbicacionConocida);
          return;
        }
        let mensaje = "No se pudo obtener la ubicación GPS.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje =
              "Permiso de ubicación denegado. Para activarlo, permite la Ubicación en el navegador.";
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
        enableHighAccuracy: !isWindows,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  },

  iniciarMonitoreoContinuoAntiTrampa: (
    onAnomalyDetected: (mensaje: string) => void,
  ): number | null => {
    return null;
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
