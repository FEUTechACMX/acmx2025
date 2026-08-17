import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, RegistrationRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import {
  check,
  hasErrors,
  str,
  required,
  maxLength,
  email,
  phone,
  personName,
  integerBetween,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Event registration.
 *
 * Events are deliberately open to non-members, so this endpoint stays reachable
 * without a session. What it will *not* do is let the caller declare who they
 * are. There are exactly three paths, and the server picks between them from
 * the session — never from the request body:
 *
 *   1. **An officer** may register anybody. This is the walk-in desk. Membership
 *      is resolved by looking the student number and school email up against
 *      real accounts, so an officer records who turned up but cannot promote
 *      them.
 *   2. **A signed-in member** registers themselves, and only themselves. Their
 *      identifying fields come from their account, not the payload — the body
 *      supplies only the per-event answers (section, professor, and so on).
 *   3. **Anyone else** is registered as a NON_MEMBER with no linked account.
 *      A member who registers while signed out lands here: we have no way to
 *      verify that a typed student number belongs to the person typing it, and
 *      an unverified claim of membership is exactly the hole this closes. They
 *      get member standing by signing in first.
 *
 * The previous version of this route took `userId` straight from the body,
 * which let any caller attach a registration to any member's account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const eventId = str((body as Record<string, unknown>).eventId);
    if (!eventId) {
      return NextResponse.json({ error: "Which event?" }, { status: 400 });
    }

    // An unknown event should read as "no such thing", not as a foreign-key 500.
    const event = await prisma.event.findUnique({
      where: { eventId },
      select: { eventId: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const actor = await getCurrentUser(req);
    const actingAsOfficer = !!actor && isEventAdmin(actor.role);

    // A signed-in member is registering themselves: identity comes off the
    // account. Everyone else describes a registrant in the payload.
    const identity =
      actor && !actingAsOfficer
        ? {
            fullName: [actor.firstName, actor.middleName, actor.lastName, actor.suffix]
              .filter(Boolean)
              .join(" "),
            studentNumber: actor.studentId,
            schoolEmail: actor.schoolEmail,
            contactNumber: actor.contactNumber,
            facebookLink: actor.facebookLink,
            degreeProgram: actor.degreeProgram,
            yearLevel: String(actor.yearLevel),
          }
        : {
            fullName: str((body as Record<string, unknown>).fullName),
            studentNumber: str((body as Record<string, unknown>).studentNumber),
            schoolEmail: str((body as Record<string, unknown>).schoolEmail),
            contactNumber: str((body as Record<string, unknown>).contactNumber),
            facebookLink: str((body as Record<string, unknown>).facebookLink),
            degreeProgram: str((body as Record<string, unknown>).degreeProgram),
            yearLevel: str((body as Record<string, unknown>).yearLevel),
          };

    // Per-event answers are always the caller's to give — they describe this
    // registration, not the person.
    const section = str((body as Record<string, unknown>).section);
    const professor = str((body as Record<string, unknown>).professor);

    const errors = check(
      { ...identity, section, professor },
      {
        fullName: [required("Full name"), personName("Full name")],
        studentNumber: [required("Student number"), maxLength("Student number", 20)],
        schoolEmail: [required("School email"), email("School email")],
        contactNumber: [phone("Contact number")],
        facebookLink: [maxLength("Facebook link", 200)],
        degreeProgram: [maxLength("Degree program", 100)],
        yearLevel: [required("Year level"), integerBetween("Year level", 1, 6)],
        section: [maxLength("Section", 40)],
        professor: [maxLength("Professor", 80)],
      }
    );

    if (hasErrors(errors)) {
      return NextResponse.json(
        { error: Object.values(errors)[0], errors },
        { status: 400 }
      );
    }

    // Membership resolution. A self-registering member is already known; for an
    // officer's walk-in we look the registrant up. Signed-out callers are never
    // matched — see the note above.
    let linkedUserId: string | null = null;
    if (actor && !actingAsOfficer) {
      linkedUserId = actor.id;
    } else if (actingAsOfficer) {
      const found = await prisma.user.findFirst({
        where: {
          OR: [
            { studentId: identity.studentNumber },
            { schoolEmail: identity.schoolEmail },
          ],
        },
        select: { id: true },
      });
      linkedUserId = found?.id ?? null;
    }

    const role = linkedUserId ? RegistrationRole.MEMBER : RegistrationRole.NON_MEMBER;

    // No pre-check: the three unique constraints on (eventId, …) are the real
    // guard, and a read-then-write here would just be a race with a friendlier
    // error message. P2002 below turns a lost race into the same 409.
    const registration = await prisma.registration.create({
      data: {
        userId: linkedUserId,
        eventId,
        fullName: identity.fullName,
        studentNumber: identity.studentNumber,
        schoolEmail: identity.schoolEmail,
        contactNumber: identity.contactNumber,
        facebookLink: identity.facebookLink,
        yearLevel: Number(identity.yearLevel),
        section,
        professor,
        degreeProgram: identity.degreeProgram,
        role,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    console.error("Unexpected error (registrations):", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
