"use client";

import { useEffect, useState } from "react";
import type { safeUser } from "@/types/auth";

/**
 * The signed-in member, read on the client.
 *
 * The root layout used to `await getCurrentUser()` so it could hand the nav a
 * user. That one call made every route in the app server-rendered on demand —
 * `/about`, `/officers` and `/hero` included, none of which care who is looking
 * (CLEANUP.md §5.1). Reading the session here instead lets those pages be
 * prerendered again; the nav resolves its own state just after hydration.
 *
 * There is deliberately no broadcast channel, unlike `cartClient`. Both auth
 * transitions are already full document loads — login sends you to /dashboard
 * via `window.location`, logout reloads — so the module cache below cannot go
 * stale: it dies with the document that created it.
 */

type Member = NonNullable<safeUser>;
type Session = { user: Member | null };

/**
 * Set only from inside the effect below, which never runs on the server, so
 * this cannot leak one visitor's session into another's render.
 */
let cached: Session | null = null;
let inFlight: Promise<Session> | null = null;

async function read(): Promise<Session> {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return { user: null };
    // `{ ok: true, user }` where user is the member or an explicit null. The
    // route used to answer a bare `{}` for both "signed out" and "server error",
    // which is why this reads the field rather than inferring from the status.
    const data: { ok?: boolean; user?: Member | null } = await res.json();
    return { user: data.user ?? null };
  } catch {
    // Network failure and signed-out both land here, and for the nav's purposes
    // they mean the same thing: render nothing member-specific.
    return { user: null };
  }
}

/** One request per document, however many components ask. */
function load(): Promise<Session> {
  if (cached) return Promise.resolve(cached);
  inFlight ??= read().then((session) => {
    cached = session;
    inFlight = null;
    return session;
  });
  return inFlight;
}

export type SessionState = {
  user: Member | null;
  /**
   * True until the answer is known. Worth branching on: treating "not loaded"
   * as "signed out" is what makes a nav flash a LOG IN button at a member on
   * every page load.
   */
  loading: boolean;
};

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(cached);

  useEffect(() => {
    if (session) return;
    let alive = true;
    // No suppression needed here, unlike the nine `void load()` sites elsewhere:
    // the setState sits in a `.then()` callback rather than after an `await` in
    // an async function body, which the rule follows correctly.
    void load().then((next) => {
      if (alive) setSession(next);
    });
    return () => {
      alive = false;
    };
  }, [session]);

  return { user: session?.user ?? null, loading: session === null };
}
