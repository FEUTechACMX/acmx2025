import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPendingUser } from "@/lib/identity";
import {
  clientAddress,
  membershipApplyByAccount,
  membershipApplyByAddress,
} from "@/lib/rate-limit";
import {
  EXISTING_ACCOUNT_ERROR,
  UNIQUE_TAKEN_ERROR,
  isPrismaUniqueViolation,
  validateMembershipApplication,
  type MembershipPersonInput,
} from "@/lib/membership";
import { membershipWindowOpen } from "@/lib/campaign-windows";

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
  if (!membershipWindowOpen()) {
    return NextResponse.json(
      { error: "Membership registration is not open right now." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = validateMembershipApplication(body as Record<string, unknown>);
  if (!parsed.ok) {
    const first = Object.values(parsed.errors).find(Boolean) ?? "Please check the form.";
    return NextResponse.json({ error: first, errors: parsed.errors }, { status: 400 });
  }

  const payerId = parsed.value.members[0]!.studentId;
  const accountKey = `apply:${payerId}`;
  const addressKey = `apply:${clientAddress(req)}`;
  const byAccount = membershipApplyByAccount.check(accountKey);
  const byAddress = membershipApplyByAddress.check(addressKey);
  const blocked = !byAccount.allowed ? byAccount : !byAddress.allowed ? byAddress : null;
  if (blocked) {
    membershipApplyByAccount.fail(accountKey);
    membershipApplyByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "Too many applications. Wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(blocked.retryAfter) } }
    );
  }

  const or = parsed.value.members.flatMap((m) => [
    { studentId: m.studentId },
    { personalEmail: m.personalEmail },
    { schoolEmail: m.schoolEmail },
  ]);
  const existing = await prisma.user.findFirst({ where: { OR: or }, select: { id: true } });
  if (existing) {
    membershipApplyByAccount.fail(accountKey);
    membershipApplyByAddress.fail(addressKey);
    return NextResponse.json({ error: EXISTING_ACCOUNT_ERROR }, { status: 409 });
  }

  try {
    const applicationId = await prisma.$transaction(async (tx) => {
      const users = [];
      for (const member of parsed.value.members) {
        users.push(await createPendingUser(personToPending(member), tx));
      }
      const payer = users[0]!;
      const application = await tx.membershipApplication.create({
        data: {
          payerUserId: payer.id,
          bundle: parsed.value.bundle,
          kind: "NEW",
          proofStorageKey: parsed.value.proofStorageKey,
          proofUploadedAt: new Date(),
          status: "PENDING",
          members: {
            create: users.map((u, i) => ({
              userId: u.id,
              orderIndex: i,
              createdAsPending: true,
            })),
          },
        },
      });
      return application.id;
    });

    membershipApplyByAccount.reset(accountKey);
    return NextResponse.json({ ok: true, applicationId });
  } catch (err) {
    membershipApplyByAccount.fail(accountKey);
    membershipApplyByAddress.fail(addressKey);
    if (isPrismaUniqueViolation(err)) {
      return NextResponse.json({ error: UNIQUE_TAKEN_ERROR }, { status: 409 });
    }
    console.error("membership apply:", err);
    return NextResponse.json({ error: "Could not submit the application. Try again." }, { status: 500 });
  }
}
