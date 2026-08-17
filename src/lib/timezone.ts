/**
 * The chapter operates in Manila, and everything it records — attendance,
 * event times — is read in Manila. That is a *formatting* concern, not a
 * storage one.
 *
 * A `Date` is an instant, not a wall-clock reading: it carries no timezone.
 * So timestamps are stored as plain UTC instants (`new Date()`) and converted
 * to Manila only at the point they are shown to somebody.
 *
 * This module previously exported `getPhilippineTime()`, which did:
 *
 *     new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }))
 *
 * That renders Manila's wall clock to a *string*, then re-parses that string in
 * the server's own zone. On a UTC host the result was an instant eight hours in
 * the future, and it was being written straight into `Attendance.timeIn` and
 * `timeOut`. Do not reintroduce it — to record "now", use `new Date()`.
 */

export const MANILA_TZ = "Asia/Manila";

/** Date and time as read in Manila, e.g. "17 Aug 2026, 2:45 pm". */
export function formatManila(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TZ,
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date);
}

/** Clock time only, e.g. "2:45 pm" — for attendance sheets. */
export function formatManilaTime(value: Date | string): string {
  return formatManila(value, { dateStyle: undefined, timeStyle: "short" });
}
