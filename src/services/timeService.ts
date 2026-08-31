class TimeService {
  private baseServerTimeMs: number | null = null;
  private basePerformanceMs: number = 0;
  private fallbackOffsetMs: number = 0;

  constructor() {
    this.loadFallbackOffset();
    this.syncWithWorldTime();

    // Guardar periódicamente el tiempo local para detectar retrocesos si la app se cierra
    setInterval(() => {
      this.saveLastLocalTime();
    }, 5000);
  }

  private loadFallbackOffset() {
    const savedOffset = localStorage.getItem("time_offset_ms");
    const savedLastLocal = localStorage.getItem("last_local_time");

    if (savedOffset) {
      this.fallbackOffsetMs = parseInt(savedOffset, 10);
    }

    if (savedLastLocal) {
      const lastLocal = parseInt(savedLastLocal, 10);
      const currentLocal = Date.now();
      
      // Si el reloj local actual es MENOR al último registrado, atrasaron el reloj del sistema.
      if (currentLocal < lastLocal) {
        const timeJumpBackward = lastLocal - currentLocal;
        console.warn(`Trampa detectada: El reloj se atrasó ${timeJumpBackward}ms offline. Compensando...`);
        // Compensamos el offset para que el reloj resultante no retroceda
        this.fallbackOffsetMs += timeJumpBackward;
      }
    }
  }

  private saveLastLocalTime() {
    localStorage.setItem("last_local_time", Date.now().toString());
  }

  public async syncWithWorldTime() {
    try {
      const response = await fetch("https://worldtimeapi.org/api/timezone/America/Mexico_City");
      if (response.ok) {
        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();
        
        this.baseServerTimeMs = serverTime;
        this.basePerformanceMs = performance.now();
        
        this.fallbackOffsetMs = serverTime - Date.now();
        localStorage.setItem("time_offset_ms", this.fallbackOffsetMs.toString());
        this.saveLastLocalTime();
        console.log("TimeService sincronizado con WorldTimeAPI.");
      }
    } catch (e) {
      console.warn("No se pudo sincronizar la hora con WorldTimeAPI", e);
    }
  }

  public setOffsetFromHeader(dateHeader: string) {
    if (!dateHeader) return;
    const serverTime = new Date(dateHeader).getTime();
    if (!isNaN(serverTime)) {
      this.baseServerTimeMs = serverTime;
      this.basePerformanceMs = performance.now();
      
      this.fallbackOffsetMs = serverTime - Date.now();
      localStorage.setItem("time_offset_ms", this.fallbackOffsetMs.toString());
      this.saveLastLocalTime();
    }
  }

  public now(): Date {
    // Si tenemos conexión comprobada en esta sesión, usamos performance (inmune a todo)
    if (this.baseServerTimeMs !== null) {
      return new Date(this.baseServerTimeMs + (performance.now() - this.basePerformanceMs));
    }
    
    // Si iniciamos offline, usamos Date.now() ajustado con el offset blindado (nunca retrocede)
    return new Date(Date.now() + this.fallbackOffsetMs);
  }
}

export const timeService = new TimeService();
