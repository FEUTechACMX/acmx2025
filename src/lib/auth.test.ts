import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The gate that every protected route now goes through (CLEANUP.md §5.4/§9.1).
 * Prisma is mocked so this stays a unit test — the point is the 401-vs-403
 * decision, not the query.
 */
const findUnique = vi.fn();
vi.mock("./prisma", () => ({
  prisma: { session: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

const { requireRole, requireUser } = await import("./auth");
const { isAdmin, isEventAdmin } = await import("@/types/auth");

/** Minimal stand-in for the parts of NextRequest that getCurrentUser touches. */
const reqWithSession = (value?: string) =>
  ({ cookies: { get: () => (value ? { value } : undefined) } }) as never;

const session = (role: string, expired = false) => ({
  id: "sess_1",
  expiresAt: new Date(Date.now() + (expired ? -1000 : 60_000)),
  user: { id: "u1", studentId: "202312437", role },
});

beforeEach(() => {
  findUnique.mockReset();
  // React's cache() memoises per request; in tests each call is its own scope,
  // but reset anyway so a stale resolution can't leak between cases.
});

describe("requireRole — 401 when there is no valid session", () => {
  it("401s with no cookie, without querying at all", async () => {
    const auth = await requireRole(reqWithSession(undefined), isAdmin);
    expect(auth.ok).toBe(false);
    if (auth.ok) return;
    expect(auth.response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("401s when the cookie names no session", async () => {
    findUnique.mockResolvedValue(null);
    const auth = await requireRole(reqWithSession("nope"), isAdmin);
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.response.status).toBe(401);
  });

  it("401s on an expired session rather than honouring it", async () => {
    findUnique.mockResolvedValue(session("ADMIN", true));
    const auth = await requireRole(reqWithSession("s"), isAdmin);
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.response.status).toBe(401);
  });

  it("says it is a sign-in problem, not a permission one", async () => {
    const auth = await requireRole(reqWithSession(undefined), isAdmin);
    if (auth.ok) throw new Error("expected refusal");
    await expect(auth.response.json()).resolves.toEqual({ error: "Not signed in." });
  });
});

describe("requireRole — 403 only when a real role check fails", () => {
  it("403s a signed-in member who lacks the role", async () => {
    findUnique.mockResolvedValue(session("MEMBER"));
    const auth = await requireRole(reqWithSession("s"), isAdmin);
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.response.status).toBe(403);
  });

  it("distinguishes its message from the 401 case", async () => {
    findUnique.mockResolvedValue(session("MEMBER"));
    const auth = await requireRole(reqWithSession("s"), isAdmin);
    if (auth.ok) throw new Error("expected refusal");
    const body = await auth.response.json();
    expect(body.error).not.toMatch(/signed in/i);
    expect(body.error).toMatch(/access/i);
  });
});

describe("requireRole — admission", () => {
  it("admits an ADMIN and hands back the account", async () => {
    findUnique.mockResolvedValue(session("ADMIN"));
    const auth = await requireRole(reqWithSession("s"), isAdmin);
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.user.studentId).toBe("202312437");
  });

  it("treats the President and VPs as interchangeable with ADMIN", async () => {
    for (const role of ["PRESIDENT", "VP_INTERNAL", "VP_EXTERNAL"]) {
      findUnique.mockResolvedValue(session(role));
      const auth = await requireRole(reqWithSession("s"), isAdmin);
      expect(auth.ok, `${role} should pass isAdmin`).toBe(true);
    }
  });

  it("lets a MEDIA_OFFICER through the event gate but not the admin one", async () => {
    findUnique.mockResolvedValue(session("MEDIA_OFFICER"));
    expect((await requireRole(reqWithSession("s"), isEventAdmin)).ok).toBe(true);
    findUnique.mockResolvedValue(session("MEDIA_OFFICER"));
    expect((await requireRole(reqWithSession("s"), isAdmin)).ok).toBe(false);
  });
});

describe("requireUser", () => {
  it("admits any signed-in member regardless of role", async () => {
    findUnique.mockResolvedValue(session("MEMBER"));
    expect((await requireUser(reqWithSession("s"))).ok).toBe(true);
  });

  it("still 401s when signed out", async () => {
    const auth = await requireUser(reqWithSession(undefined));
    expect(auth.ok).toBe(false);
    if (!auth.ok) expect(auth.response.status).toBe(401);
  });
});
