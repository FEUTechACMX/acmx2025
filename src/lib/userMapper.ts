import { User } from "@prisma/client";
import { safeUser } from "@/types/auth";

/**
 * Takes `Omit<User, "password">` rather than `User` so it also accepts the
 * already-stripped row that `login()` returns. A full `User` still satisfies it.
 */
export function toSafeUser(user: Omit<User, "password">): safeUser {
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
