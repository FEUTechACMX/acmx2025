import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { committeeScope } from "@/lib/committee-access";
import { maxLength, required, str, check, hasErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, () => true);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const scope = await committeeScope(auth.user);
  if (scope.access(id) === "NONE") {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  const questions = await prisma.committeeQuestion.findMany({
    where: { committeeId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ ok: true, questions });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, () => true);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const scope = await committeeScope(auth.user);
  if (scope.access(id) !== "EDIT") {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const texts = Array.isArray((body as { texts?: unknown })?.texts)
    ? ((body as { texts: unknown[] }).texts).map((t) => str(t))
    : [];
  if (texts.length !== 3) {
    return NextResponse.json({ error: "Exactly three statements are required." }, { status: 400 });
  }
  const errors = texts.map((text, i) =>
    check({ text }, { text: [required(`Statement ${i + 1}`), maxLength(`Statement ${i + 1}`, 500)] })
  );
  if (errors.some(hasErrors)) {
    return NextResponse.json({ error: "Each statement needs copy." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.committeeQuestion.deleteMany({ where: { committeeId: id } });
    await tx.committeeQuestion.createMany({
      data: texts.map((text, order) => ({ committeeId: id, order, text, active: true })),
    });
  });

  const questions = await prisma.committeeQuestion.findMany({
    where: { committeeId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ ok: true, questions });
}
