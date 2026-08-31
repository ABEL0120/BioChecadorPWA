class TimeService {
  private baseServerTimeMs: number | null = null;
  private basePerformanceMs: number = 0;
  private fallbackOffsetMs: number = 0;

  constructor() {
    this.loadFallbackOffset();
    this.syncWithWorldTime();

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
      if (currentLocal < lastLocal) {
        const timeJumpBackward = lastLocal - currentLocal;
        this.fallbackOffsetMs += timeJumpBackward;
      }
    }
  }

  private saveLastLocalTime() {
    localStorage.setItem("last_local_time", Date.now().toString());
  }

  public async syncWithWorldTime() {
    try {
      const response = await fetch(
        "https://worldtimeapi.org/api/timezone/America/Mexico_City",
      );
      if (response.ok) {
        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();

        this.baseServerTimeMs = serverTime;
        this.basePerformanceMs = performance.now();

        this.fallbackOffsetMs = serverTime - Date.now();
        localStorage.setItem(
          "time_offset_ms",
          this.fallbackOffsetMs.toString(),
        );
        this.saveLastLocalTime();
      }
    } catch (e) {}
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
    if (this.baseServerTimeMs !== null) {
      return new Date(
        this.baseServerTimeMs + (performance.now() - this.basePerformanceMs),
      );
    }
    return new Date(Date.now() + this.fallbackOffsetMs);
  }
}

export const timeService = new TimeService();
