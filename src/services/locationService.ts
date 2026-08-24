export interface GpsLocationResult {
  latitud: number;
  longitud: number;
  accuracy: number;
}

export const locationService = {
  obtenerUbicacionActual: (): Promise<GpsLocationResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Tu navegador o dispositivo no soporta geolocalización GPS.")
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
        }
      );
    });
  },
  seguirUbicacionActual: (
    onSuccess: (loc: GpsLocationResult) => void,
    onError: (err: Error) => void
  ): number | null => {
    if (!navigator.geolocation) {
      onError(new Error("Tu navegador o dispositivo no soporta geolocalización GPS."));
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
            mensaje = "Información de ubicación no disponible. Verifica que tu GPS esté encendido.";
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
      }
    );
  },
  detenerSeguimiento: (watchId: number) => {
    if (navigator.geolocation && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
};
