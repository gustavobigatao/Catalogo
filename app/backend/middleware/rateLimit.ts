const windowMs = 60_000;
const maxRequests = 3;

const hits = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}

setInterval(cleanup, windowMs);
cleanup();

export function checkRateLimit(ip: string): void {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    throw Object.assign(new Error("Muitos pedidos. Tente novamente em 1 minuto."), {
      code: "TOO_MANY_REQUESTS" as const,
      httpStatus: 429,
    });
  }
}
