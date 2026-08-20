import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";
import { createPendingUser } from "@/lib/identity";
import { membershipRenewByUser } from "@/lib/rate-limit";
import {
  EXISTING_ACCOUNT_ERROR,
  UNIQUE_TAKEN_ERROR,
  isPrismaUniqueViolation,
  validateRenewalPayload,
  type MembershipPersonInput,
} from "@/lib/membership";

export const dynamic = "force-dynamic";

function personToPending(p: MembershipPersonInput) {
  return {
    studentId: p.studentId,
    password: p.password,
    firstName: p.firstName,
    middleName: p.middleName,
    lastName: p.lastName,
    suffix: p.suffix,
    yearLevel: p.yearLevel,
    degreeProgram: p.degreeProgram,
    personalEmail: p.personalEmail,
    schoolEmail: p.schoolEmail,
    contactNumber: p.contactNumber,
    facebookLink: p.facebookLink,
    discordName: p.discordName,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const limited = membershipRenewByUser.check(auth.user.id);
  if (!limited.allowed) {
    membershipRenewByUser.fail(auth.user.id);
    return NextResponse.json(
      { error: "Too many renewal attempts. Wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = validateRenewalPayload(body as Record<string, unknown>);
  if (!parsed.ok) {
    const first = Object.values(parsed.errors).find(Boolean) ?? "Please check the form.";
    return NextResponse.json({ error: first, errors: parsed.errors }, { status: 400 });
  }

  if (parsed.value.teammates.length > 0) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: parsed.value.teammates.flatMap((m) => [
          { studentId: m.studentId },
          { personalEmail: m.personalEmail },
          { schoolEmail: m.schoolEmail },
        ]),
      },
      select: { id: true },
    });
    if (existing) {
      membershipRenewByUser.fail(auth.user.id);
      return NextResponse.json({ error: EXISTING_ACCOUNT_ERROR }, { status: 409 });
    }
  }

  try {
    const applicationId = await prisma.$transaction(async (tx) => {
      const created: { id: string }[] = [];
      for (const teammate of parsed.value.teammates) {
        created.push(await createPendingUser(personToPending(teammate), tx));
      }
      const application = await tx.membershipApplication.create({
        data: {
          payerUserId: auth.user.id,
          bundle: parsed.value.bundle,
          kind: "RENEWAL",
          proofStorageKey: parsed.value.proofStorageKey,
          proofUploadedAt: new Date(),
          status: "PENDING",
          members: {
            create: [
              {
                userId: auth.user.id,
                orderIndex: 0,
                createdAsPending: false,
              },
              ...created.map((u, i) => ({
                userId: u.id,
                orderIndex: i + 1,
                createdAsPending: true,
              })),
            ],
          },
        },
      });
      return application.id;
    });

    membershipRenewByUser.reset(auth.user.id);
    return NextResponse.json({ ok: true, applicationId });
  } catch (err) {
    membershipRenewByUser.fail(auth.user.id);
    if (isPrismaUniqueViolation(err)) {
      return NextResponse.json({ error: UNIQUE_TAKEN_ERROR }, { status: 409 });
    }
    console.error("membership renew:", err);
    return NextResponse.json({ error: "Could not submit the renewal. Try again." }, { status: 500 });
  }
}
