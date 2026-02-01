// Imports
import { decryptAES } from "@/lib/crypto";
import { parseQrPayload, QrPayload } from "@/lib/qrParser";

//Services Import
import { userVerification } from "@/services/identity/identityService";
import { recordTimeIn } from "@/services/attendance/attendanceService";
import { recordTimeOut } from "@/services/attendance/attendanceService";

// Take QR payload
// Decrypt/parse
export async function verifyScannedQR(encrypted: string, key?: string) {
  if (!encrypted || typeof encrypted !== "string") {
    throw new Error("Missing 'encrypted' payload");
  }

  const secretKey = key || process.env.QR_SECRET_KEY;
  if (!secretKey) throw new Error("Server missing QR_SECRET_KEY");

  //Decrypt
  const decrypted = decryptAES(encrypted, secretKey);

  //Parse
  const payload = parseQrPayload(decrypted);

  if (!payload.studentID) {
    throw new Error("QR payload missing studentID");
  }

  return payload;
}

// Validate if user exists (services/identity/IdentityServices.ts)
export async function verifyUserFromQr(payload: QrPayload) {
  const user = await userVerification(
    payload.studentID,
    payload.firstName,
    payload.lastName,
  );

  if (!user) throw new Error("User not found");

  return user;
}

// Record Time In (services /attendance/attendanceService.ts)
export async function TimeIn(payload: QrPayload, eventId: string) {
  try {
    const attendanceRecord = await recordTimeIn(payload.studentID, eventId);

    return {
      success: true,
      message: "Time-in recorded successfully",
      attendanceId: attendanceRecord.id,
      timeIn: attendanceRecord.timeIn,
      eventId: eventId,
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? "Unknown error";
    return { success: false, message };
  }
}

// Record Time Out (services /attendance/attendanceService.ts)
export async function TimeOut(payload: QrPayload, eventId: string) {
  try {
    const attendanceRecord = await recordTimeOut(payload.studentID, eventId);

    return {
      success: true,
      message: "Time-out recorded successfully",
      attendanceRecord,
    };
  } catch (err: unknown) {
    const message =
      (err as Error)?.message ?? "Time-out not Recorded Successfully";
    return { success: false, message };
  }
}
