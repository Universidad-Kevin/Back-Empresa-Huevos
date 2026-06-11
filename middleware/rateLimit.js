// Rate limiter en memoria — funciona para despliegue de instancia única (Railway).
// Para múltiples réplicas se necesitaría Redis.

const buckets = new Map(); // ip -> { count, resetAt }

const cleaner = setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (now > b.resetAt) buckets.delete(ip);
  }
}, 60_000);
if (cleaner.unref) cleaner.unref();

function makeLimit(maxRequests, windowMs, message) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();

    let b = buckets.get(ip);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, b);
    }

    b.count++;
    if (b.count > maxRequests) {
      const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
      res.set("Retry-After", retryAfterSec);
      return res.status(429).json({ error: message, retryAfter: retryAfterSec });
    }

    next();
  };
}

// 10 intentos de login por IP cada 15 minutos
export const loginRateLimit = makeLimit(
  10,
  15 * 60 * 1000,
  "Demasiados intentos de inicio de sesión. Espera 15 minutos e intenta de nuevo."
);

// 5 registros por IP por hora
export const registerRateLimit = makeLimit(
  5,
  60 * 60 * 1000,
  "Demasiadas cuentas creadas desde esta IP. Intenta de nuevo en 1 hora."
);
