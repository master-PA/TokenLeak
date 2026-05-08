type Bucket = { count: number; resetAtMs: number };

const buckets = new Map<string, Bucket>();

export function basicRateLimit(opts: {
  key: string;
  windowMs: number;
  max: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(opts.key);
  if (!existing || now >= existing.resetAtMs) {
    buckets.set(opts.key, { count: 1, resetAtMs: now + opts.windowMs });
    return { ok: true };
  }

  if (existing.count >= opts.max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAtMs - now) / 1000),
      ),
    };
  }

  existing.count += 1;
  return { ok: true };
}

