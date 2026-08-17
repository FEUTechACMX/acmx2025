import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientAddress, createThrottle } from "./rate-limit";

const WINDOW = 15 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("createThrottle", () => {
  it("allows attempts up to the limit", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 3 });
    for (let i = 0; i < 3; i++) {
      expect(t.check("k").allowed).toBe(true);
      t.fail("k");
    }
    expect(t.check("k").allowed).toBe(false);
  });

  it("does not count anything on check alone", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    for (let i = 0; i < 20; i++) expect(t.check("k").allowed).toBe(true);
  });

  it("keeps keys independent, so one account cannot lock out another", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("a");
    expect(t.check("a").allowed).toBe(false);
    expect(t.check("b").allowed).toBe(true);
  });

  it("reports a retryAfter inside the window", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("k");
    const { retryAfter } = t.check("k");
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(WINDOW / 1000);
  });

  it("counts down retryAfter as the window elapses", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("k");
    const first = t.check("k").retryAfter;
    vi.advanceTimersByTime(WINDOW / 2);
    expect(t.check("k").retryAfter).toBeLessThan(first);
  });

  it("forgives once the window rolls over", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("k");
    expect(t.check("k").allowed).toBe(false);
    vi.advanceTimersByTime(WINDOW);
    expect(t.check("k").allowed).toBe(true);
  });

  it("does not forgive a moment early", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("k");
    vi.advanceTimersByTime(WINDOW - 1);
    expect(t.check("k").allowed).toBe(false);
  });

  it("starts a fresh window after rollover rather than resuming the old count", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 2 });
    t.fail("k");
    t.fail("k");
    vi.advanceTimersByTime(WINDOW);
    t.fail("k"); // first of a new window
    expect(t.check("k").allowed).toBe(true);
  });

  it("reset clears a key, so a success wipes earlier typos", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 1 });
    t.fail("k");
    expect(t.check("k").allowed).toBe(false);
    t.reset("k");
    expect(t.check("k").allowed).toBe(true);
  });

  it("stays blocked while failures keep arriving", () => {
    const t = createThrottle({ windowMs: WINDOW, max: 2 });
    t.fail("k");
    t.fail("k");
    vi.advanceTimersByTime(WINDOW - 1000);
    t.fail("k");
    expect(t.check("k").allowed).toBe(false);
  });
});

describe("clientAddress", () => {
  const withHeaders = (h: Record<string, string>) =>
    new Request("https://acmx.test/api/login", { method: "POST", headers: h });

  it("takes the first hop of x-forwarded-for", () => {
    expect(clientAddress(withHeaders({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe(
      "203.0.113.9"
    );
  });

  it("trims whitespace", () => {
    expect(clientAddress(withHeaders({ "x-forwarded-for": "  203.0.113.9  " }))).toBe(
      "203.0.113.9"
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientAddress(withHeaders({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("returns a stable placeholder when neither header is present", () => {
    // Everyone lands in one bucket, which is why the per-account limit is the
    // one doing the real work.
    expect(clientAddress(withHeaders({}))).toBe("unknown");
  });
});
