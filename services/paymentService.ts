//Payment Service Logic

//imports
import { prisma } from "../lib/prisma";
import { TransactionType, TransactionStatus } from "@prisma/client";

//To Do:
//Function to send to DB the Details about payment

interface Transaction {
  user_id: string;
  fullName: string;
  schoolEmail: string;
  receipt_image_url?: File;
  description: string;
  points?: number;
  created_at: Date;
}

//Purchase Transaction Record Creation
export async function createPurchaseRequest(transactionRecord: Transaction) {
  //Validate if transaction Request has A File Image Upload
  if (!transactionRecord.receipt_image_url) {
    throw new Error(
      "This Type of Transaction Requires an Image Receipt File Upload"
    );
  } else {
    await prisma.transaction.create({
      data: {
        user_id: transactionRecord.user_id,
        fullName: transactionRecord.fullName,
        schoolEmail: transactionRecord.schoolEmail,
        imageURL: transactionRecord.receipt_image_url,
        type: "PURCHASE",
        description: transactionRecord.description,
        status: "PENDING",
      },
    });
  }
}

//Attendance Points Reward System
export async function attendanceRewardValidation(
  transactionRecord: Transaction,
  eventId: string
) {
  //Three Levels of Validation before credit
  //1. User is a registered ACM Member
  const userValidation = await prisma.user.findFirst({
    where: {
      studentId: transactionRecord.user_id,
    },
  });

  if (!userValidation) {
    return { success: false, reason: "User is not a registered member" };
  }

  //2. User has been recorded in the attendance logs
  const recordValidation = await prisma.attendance.findFirst({
    where: {
      userId: transactionRecord.user_id,
      eventId: eventId,
    },
  });

  if (!recordValidation) {
    return { success: false, reason: "No valid attendance record found" };
  }

  //3. (Timeout - Time In) has to be greater than 1 hour.
  //Variable declaration and computation for time spent in the event, and equivalent of one hour in millisecond.
  if (!recordValidation.timeOut) {
    return { success: false, reason: "User has not timed out yet" };
  }

  const timeSpentMs =
    recordValidation?.timeOut?.getTime() - recordValidation?.timeIn.getTime();

  const ONE_HOUR_MS = 60 * 60 * 1000;

  if (timeSpentMs < ONE_HOUR_MS) {
    return { success: false, reason: "Attendance time less than 1 hour" };
  }

  return { success: true };
}
