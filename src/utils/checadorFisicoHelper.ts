export const extraerTokenChecadorFisico = (texto: string): string => {
  if (!texto) return "";
  const limpio = texto.trim();
  if (!limpio) return "";

  if (limpio.startsWith("{") && limpio.endsWith("}")) {
    try {
      const obj = JSON.parse(limpio);
      const val =
        obj.tokenChecadorFisico ||
        obj.token ||
        obj.t ||
        obj.code ||
        obj.tokenChecador;
      if (val) return String(val).trim();
    } catch {}
  }

  if (limpio.includes("?") || limpio.startsWith("http://") || limpio.startsWith("https://")) {
    try {
      const url = new URL(limpio, window.location.origin);
      const token =
        url.searchParams.get("tokenChecadorFisico") ||
        url.searchParams.get("token") ||
        url.searchParams.get("t") ||
        url.searchParams.get("code") ||
        url.searchParams.get("tokenChecador");
      if (token) return token.trim();
    } catch {}
  }

  const queryMatch = limpio.match(/[?&#](?:tokenChecadorFisico|token|t|code)=([a-zA-Z0-9_\-]+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1].trim();
  }

  return limpio;
};

