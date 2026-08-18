import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import {
  check,
  dateTime,
  hasErrors,
  maxLength,
  money,
  oneOf,
  required,
  str,
  type Rule,
} from "@/lib/validation";

const SEMESTERS = ["FIRST", "SECOND", "THIRD"] as const;
const STATUSES = ["UPCOMING", "ONGOING", "FINISHED"] as const;

/** A list of short strings — `type`, `gallery`, `specificObjectives`. */
const stringList =
  (label: string, maxItems: number, maxItemLength: number): Rule =>
  (v) => {
    if (!Array.isArray(v)) return `${label} must be a list.`;
    if (v.length > maxItems) return `${label} can hold at most ${maxItems} entries.`;
    if (v.some((entry) => typeof entry !== "string"))
      return `${label} must contain only text entries.`;
    if (v.some((entry) => (entry as string).length > maxItemLength))
      return `Each ${label} entry must be ${maxItemLength} characters or fewer.`;
    return null;
  };

/** `null` clears the override back to "derive from the dates". */
const nullableStatus: Rule = (v) =>
  v === null || v === "" ? null : oneOf("Status", STATUSES)(v);

/**
 * Every field this endpoint will accept, with the rule that guards it. A key
 * absent from the body is left untouched — this is a PATCH, and the admin
 * console sends only what changed.
 *
 * Before §6.4, the allow-list existed but nothing was validated past it:
 * `new Date(body.startDate)` on junk produced an Invalid Date and
 * `Number(body.price)` produced `NaN`, both of which threw inside Prisma and
 * came back as a 500 carrying the raw error text.
 */
const FIELD_RULES: Record<string, Rule[]> = {
  name: [required("Event name"), maxLength("Event name", 160)],
  description: [maxLength("Description", 8000)],
  venue: [required("Venue"), maxLength("Venue", 200)],
  dayOfWeek: [maxLength("Day of week", 20)],
  startDate: [dateTime("Start date")],
  endDate: [dateTime("End date")],
  priceOfficer: [money("Officer rate")],
  priceMember: [money("Member rate")],
  priceNonMember: [money("Non-member rate")],
  image: [maxLength("Image URL", 600)],
  cardImage: [maxLength("Card image URL", 600)],
  gallery: [stringList("Gallery", 60, 600)],
  statusOverride: [nullableStatus],
  eventSemester: [oneOf("Semester", SEMESTERS)],
  type: [stringList("Type", 12, 60)],
  overview: [maxLength("Overview", 8000)],
  mainObjective: [maxLength("Main objective", 4000)],
  specificObjectives: [stringList("Specific objectives", 30, 1000)],
  targetParticipants: [maxLength("Target participants", 2000)],
  feeNote: [maxLength("Fee note", 2000)],
};

const DATE_FIELDS = new Set(["startDate", "endDate"]);
const MONEY_FIELDS = new Set(["priceOfficer", "priceMember", "priceNonMember"]);

// PATCH — update event fields (images, gallery, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }
    const raw = body as Record<string, unknown>;

    const present = Object.keys(FIELD_RULES).filter((key) => key in raw);
    if (present.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const errors = check(
      Object.fromEntries(present.map((k) => [k, raw[k]])),
      Object.fromEntries(present.map((k) => [k, FIELD_RULES[k]]))
    );
    if (hasErrors(errors)) {
      return NextResponse.json(
        { error: Object.values(errors)[0], errors },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    for (const key of present) {
      const value = raw[key];
      if (DATE_FIELDS.has(key)) data[key] = new Date(str(value));
      else if (MONEY_FIELDS.has(key)) data[key] = Number(value);
      else if (key === "statusOverride") data[key] = value === "" ? null : value;
      else data[key] = value;
    }

    const updated = await prisma.event.update({ where: { eventId }, data });

    return NextResponse.json(updated);
  } catch (err) {
    // Fixed string rather than `err.message`, which handed internal error text
    // to the caller.
    console.error("Error updating event:", err);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}
