/**
 * Legacy alias for POST /api/registrations.
 *
 * Nothing in this repository calls this path — the only in-app caller was the
 * old admin panel, and the registration modal posts to /api/registrations. It
 * survives as a re-export rather than a deletion because an external form or
 * script could still be posting here, and a 404 would fail those silently.
 *
 * It is deliberately not a second implementation. The duplicate that used to
 * live here shared the old route's identity bug and handled unique-constraint
 * collisions worse, so callers arriving on this path now get the same validated,
 * session-derived handler as everyone else.
 *
 * Safe to remove once the access logs show no traffic on it.
 */
export { POST, dynamic } from "../route";
