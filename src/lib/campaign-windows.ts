/**
 * Membership / JO campaign windows — one global pair from server env.
 * Fathi-set only; not an admin screen (SPEC-D5 §9).
 */
export type WindowState =
  | { open: true; start: string; end: string }
  | { open: false; phase: "before" | "after"; start: string; end: string }
  | { open: false; phase: "unconfigured"; start: null; end: null };

/** Calendar date YYYY-MM-DD in Asia/Manila (chapter timezone). */
export function calendarDateInManila(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function readBound(name: string): string | null {
  const raw = process.env[name]?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

/** Inclusive start..end on calendar dates (Manila). */
export function isDateInInclusiveRange(
  today: string,
  start: string,
  end: string
): boolean {
  return today >= start && today <= end;
}

function windowFromEnv(
  startKey: string,
  endKey: string,
  now: Date = new Date()
): WindowState {
  const start = readBound(startKey);
  const end = readBound(endKey);
  if (!start || !end) {
    return { open: false, phase: "unconfigured", start: null, end: null };
  }
  const today = calendarDateInManila(now);
  if (isDateInInclusiveRange(today, start, end)) {
    return { open: true, start, end };
  }
  return {
    open: false,
    phase: today < start ? "before" : "after",
    start,
    end,
  };
}

export function membershipWindow(now: Date = new Date()): WindowState {
  return windowFromEnv("MEMBERSHIP_WINDOW_START", "MEMBERSHIP_WINDOW_END", now);
}

export function joWindow(now: Date = new Date()): WindowState {
  return windowFromEnv("JO_WINDOW_START", "JO_WINDOW_END", now);
}

export function membershipWindowOpen(now: Date = new Date()): boolean {
  return membershipWindow(now).open === true;
}

export function joWindowOpen(now: Date = new Date()): boolean {
  return joWindow(now).open === true;
}
