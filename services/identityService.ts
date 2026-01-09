//imports
import { prisma } from "../lib/prisma";

//To Do:

//Scanner functions

//Member verification
//Check if QR details have a match in the User Model.
export async function UserVerification(
  studentNumber: string,
  studentFirstName: string,
  studentLastName: string
) {
  const verify = await prisma.user.findUnique({
    where: {
      studentId: studentNumber,
      firstName: studentFirstName,
      lastName: studentLastName,
    },
  });

  if (!verify) {
    throw new Error("User Does not exist in our system");
  } else {
    return verify;
  }
}
