//Attendance Rules
//1. User must exist in Registration Table to be recorded in the attendance
//2. User must have a Time-in record to be allowed a Time-out record
//3. Members with less than 1 hour of attendance won't be receiving points
//4. Offline Mode is a Must.

import { prisma } from "../../lib/prisma";

//1. Check if User Details Exists in Registration Table
// Parameters taken are Student ID and Current Event ID
// if studentID + currentEventID exists in the Registration table, return true

//2. Time In
// If validation is true, fetch all details of user + current time and insert them to the attendance logs.
// Timeout value would be currently sent to null

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
      registration: {
        connect: { id: registrant.id },
      },
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
  const result = await prisma.attendance.updateMany({
    where: { studentNumber: memberStudentNumber, eventId: currentEventId },
    data: { timeOut: new Date() },
  });

  if (result.count === 0) {
    throw new Error(
      "User has no Attendance record. Must first record a Time In"
    );
  }

  return result;
}
