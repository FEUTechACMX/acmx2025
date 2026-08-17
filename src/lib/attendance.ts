/**
 * Attendance: the door desk.
 *
 * The rules this actually enforces:
 *   1. Only a registered attendee can be recorded — attendance is written from
 *      the registration, never from the scanner's input.
 *   2. A time-out needs a time-in first, and neither can be recorded twice.
 *
 * Two further rules used to be listed here and were never built: points for
 * attendance over an hour, and an offline mode. They are gone from this comment
 * rather than left as promises the code does not keep (CLEANUP.md §3.3). The
 * points economy has a `Transaction` table and no UI; if it ships, the award
 * belongs at time-out, where the duration is finally known.
 *
 * Moved here from `src/services/attendance/` — that directory predated
 * `src/lib/` and never held anything else (§5.3).
 */

import { prisma } from "@/lib/prisma";

export async function recordTimeIn(
  studentNumber: string,
  currentEventID: string
) {
  const registrant = await prisma.registration.findUnique({
    where: {
      eventId_studentNumber: {
        studentNumber,
        eventId: currentEventID,
      },
    },
  });

  if (!registrant) {
    throw new Error("User is not Registered");
  }

  // A second scan at the door is a duplicate, not a new record. `registrationId`
  // is unique, so without this the create raises a raw P2002 that surfaces as a
  // 500 — a double-tap read as a server failure rather than "already signed in".
  const existing = await prisma.attendance.findUnique({
    where: { registrationId: registrant.id },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Already timed in");
  }

  const attendance = await prisma.attendance.create({
    data: {
      eventId: registrant.eventId,
      fullName: registrant.fullName,
      studentNumber: registrant.studentNumber,
      schoolEmail: registrant.schoolEmail,
      yearLevel: registrant.yearLevel,
      degreeProgram: registrant.degreeProgram,
      section: registrant.section,
      professor: registrant.professor,
      role: registrant.role,
      userId: registrant.userId,
      registration: {
        connect: { id: registrant.id },
      },
      // A UTC instant. Rendered in Manila at display time — see lib/timezone.
      timeIn: new Date(),
    },
  });

  return attendance;
}

//3. Time Out
//Function that checks if User Exists in the attendance logs
//If User exists in attendance log, update the Timeout value to current time
export async function recordTimeOut(
  memberStudentNumber: string,
  currentEventId: string
) {
  // `timeOut: null` guards the update: scanning out twice would otherwise keep
  // moving the recorded departure later each time.
  const result = await prisma.attendance.updateMany({
    where: {
      studentNumber: memberStudentNumber,
      eventId: currentEventId,
      timeOut: null,
    },
    data: { timeOut: new Date() },
  });

  if (result.count === 0) {
    const timedIn = await prisma.attendance.findFirst({
      where: { studentNumber: memberStudentNumber, eventId: currentEventId },
      select: { id: true },
    });
    throw new Error(
      timedIn
        ? "Already timed out"
        : "User has no Attendance record. Must first record a Time In"
    );
  }

  return result;
}
