export interface QrPayload {
  studentID: string; // primary identifier
  firstName: string;
  middleName: string;
  lastName: string;
  yearLevel: string;
  degreeProgram: string;
}

/**
 * Parse decrypted payload string into structured object
 * @param payload - Pipe-delimited string from decryptAES()
 */
export function parseQrPayload(payload: string): QrPayload {
  const parts = payload.split("|");

  if (parts.length !== 6) {
    throw new Error("Invalid QR payload format");
  }

  return {
    studentID: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts[2] || "",
    lastName: parts[3] || "",
    yearLevel: parts[4] || "",
    degreeProgram: parts[5] || "",
  };
}
