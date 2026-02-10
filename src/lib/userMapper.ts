import { User } from "@prisma/client";
import { safeUser } from "@/types/auth";

export function toSafeUser(user: User): safeUser {
  return {
    studentId: user.studentId,
    name: [user.firstName, user.middleName, user.lastName, user.suffix]
      .filter(Boolean)
      .join(" "),
    email: user.schoolEmail ?? user.personalEmail,
    points: user.points,
    role: user.role,
  };
}
