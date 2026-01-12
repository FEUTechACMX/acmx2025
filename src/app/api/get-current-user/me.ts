import { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser } from "../../../../lib/auth";
import type { User } from "../../../../types/auth";

type MeResponse = {
  user?: User;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MeResponse>
) {
  try {
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return res.status(200).json({}); //no logged in user
    }
    const safeUser: User = {
      studentId: dbUser.studentId,
      name: [dbUser.firstName, dbUser.middleName, dbUser.suffix]
        .filter(Boolean)
        .join(" "),
      email: dbUser.schoolEmail,
    };

    return res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({}); //fail safety
  }
}
