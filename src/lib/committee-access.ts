/**
 * Who may do what with a committee.
 *
 * Three tiers, and the whole of the console's committee section is built on
 * them:
 *
 *   EDIT  — the top table (ADMIN, PRESIDENT, VP_INTERNAL, VP_EXTERNAL) on every
 *           committee, plus a committee's own head / co-head — or, on the dev
 *           track, its project lead / lead dev — on that one committee.
 *   VIEW  — everyone else holding a seat on the committee. They see their own
 *           committee's record in the console, read-only.
 *   NONE  — everybody else, including officers with no seat.
 *
 * A committee lead's edit rights stop at content and roster. Creating,
 * deleting, reordering and publishing stay with the top table, because those
 * are decisions about the chapter's site rather than about one committee.
 */

import type { User } from "@prisma/client";
import { isAdmin } from "@/types/auth";
import { LEAD_POSITIONS, type CommitteeAccess, type CommitteeMemberRole } from "@/types/committee";
import { prisma } from "./prisma";

/** Every committee this user holds a seat on, and what that seat grants. */
export async function seatAccessMap(userId: string): Promise<Map<string, CommitteeAccess>> {
  const seats = await prisma.committeeMember.findMany({
    where: { userId },
    select: { committeeId: true, position: true },
  });

  const map = new Map<string, CommitteeAccess>();
  for (const seat of seats) {
    const grant: CommitteeAccess = LEAD_POSITIONS.includes(seat.position as CommitteeMemberRole)
      ? "EDIT"
      : "VIEW";
    // Belt and braces: one seat per person per committee, but if a legacy row
    // doubles up, the stronger grant wins.
    if (map.get(seat.committeeId) !== "EDIT") map.set(seat.committeeId, grant);
  }
  return map;
}

/**
 * The reusable answer for a request: whether the user runs the whole console,
 * and — when they don't — exactly which committees they can reach.
 */
export type CommitteeScope = {
  admin: boolean;
  /** Empty for admins: they aren't scoped to a list. */
  seats: Map<string, CommitteeAccess>;
  access: (committeeId: string) => CommitteeAccess;
  /** True when there's at least one committee this user can open. */
  hasAny: boolean;
};

export async function committeeScope(user: Pick<User, "id" | "role">): Promise<CommitteeScope> {
  const admin = isAdmin(user.role);
  const seats = admin ? new Map<string, CommitteeAccess>() : await seatAccessMap(user.id);

  return {
    admin,
    seats,
    access: (committeeId) => (admin ? "EDIT" : (seats.get(committeeId) ?? "NONE")),
    hasAny: admin || seats.size > 0,
  };
}

/** Shorthand for a route that only cares about one committee. */
export async function committeeAccess(
  user: Pick<User, "id" | "role">,
  committeeId: string
): Promise<CommitteeAccess> {
  if (isAdmin(user.role)) return "EDIT";
  const seat = await prisma.committeeMember.findFirst({
    where: { userId: user.id, committeeId },
    select: { position: true },
  });
  if (!seat) return "NONE";
  return LEAD_POSITIONS.includes(seat.position as CommitteeMemberRole) ? "EDIT" : "VIEW";
}

/**
 * The fields a committee lead is allowed to touch. Anything outside this list —
 * status, order, track, and the name, because renaming re-slugs the committee
 * and breaks its URL — is stripped from their PATCH rather than rejected, so a
 * lead saving the editor never hits an error over a field the form didn't let
 * them change in the first place.
 */
export const LEAD_EDITABLE_FIELDS = [
  "kicker",
  "emblem",
  "mandate",
  "blurb",
  "recruiting",
  "openSeats",
  "callBody",
  "callDeadline",
  "applyUrl",
  "contactEmail",
  "formedYear",
  "responsibilities",
  "projects",
  "facts",
  "members",
] as const;

export function restrictToLeadFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of LEAD_EDITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}
