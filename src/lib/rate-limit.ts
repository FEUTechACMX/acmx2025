/**
 * Fixed-window attempt throttles, held in module memory.
 *
 * Extracted from `api/change-password`, which had the only rate limit in the
 * codebase — while `/api/login`, the endpoint an attacker would actually target,
 * had none (CLEANUP.md §2.7).
 *
 * **What this is honestly worth.** Module memory resets on redeploy and is not
 * shared between serverless instances, so this slows a scripted attack against
 * one account from one place. It will not stop a distributed one. The real
 * protections remain bcrypt's cost factor and the fact that a failed guess
 * reveals nothing. A durable store (Upstash Redis via the Marketplace, say) is
 * the upgrade path, and the interface below is deliberately small enough that
 * swapping the backing store touches nothing else.
 */

export type ThrottleDecision = {
  allowed: boolean;
  /** Seconds until the window rolls over. Suitable for a `Retry-After` header. */
  retryAfter: number;
};

export type Throttle = {
  /** Does not record anything — call `fail` on an actual failure. */
  check(key: string): ThrottleDecision;
  fail(key: string): void;
  /** Clears a key's history. Call on success so one typo doesn't linger. */
  reset(key: string): void;
  /** Test seam. */
  clear(): void;
};

export function createThrottle({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}): Throttle {
  const hits = new Map<string, { count: number; firstAt: number }>();

  /** Drops the record if its window has rolled over. Returns the live one. */
  const current = (key: string) => {
    const record = hits.get(key);
    if (!record) return null;
    if (Date.now() - record.firstAt >= windowMs) {
      hits.delete(key);
      return null;
    }
    return record;
  };

  return {
    check(key) {
      const record = current(key);
      if (!record || record.count < max) return { allowed: true, retryAfter: 0 };
      const elapsed = Date.now() - record.firstAt;
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((windowMs - elapsed) / 1000)),
      };
    },

    fail(key) {
      const record = current(key);
      if (!record) {
        hits.set(key, { count: 1, firstAt: Date.now() });
        return;
      }
      record.count += 1;
    },

    reset(key) {
      hits.delete(key);
    },

    clear() {
      hits.clear();
    },
  };
}

/* ── The application's throttles ─────────────────────────────────
 *
 * Two buckets on login, because either alone is wrong:
 *
 * - Per account, tight. This is the bucket that matters for guessing one
 *   member's password.
 * - Per address, deliberately loose. The chapter's members share campus NAT, so
 *   a tight IP limit would lock out everyone behind one address the moment a few
 *   people mistyped. It exists to blunt someone spraying many accounts from one
 *   place, not to police normal use.
 */

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const loginByAccount = createThrottle({ windowMs: LOGIN_WINDOW_MS, max: 8 });
export const loginByAddress = createThrottle({ windowMs: LOGIN_WINDOW_MS, max: 60 });

/** Password changes are already behind a session, so one bucket is enough. */
export const passwordChangeByUser = createThrottle({
  windowMs: 15 * 60 * 1000,
  max: 8,
});

/**
 * Best available client address. `x-forwarded-for` is a client-supplied header
 * and therefore spoofable — which is precisely why the per-account bucket is the
 * one doing the real work here.
 */
export function clientAddress(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
