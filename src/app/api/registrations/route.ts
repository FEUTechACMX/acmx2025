import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const {
        eventId,
        userId,
        fullName,
        studentNumber,
        schoolEmail,
        contactNumber,
        facebookLink,
        yearLevel,
        section,
        professor,
        degreeProgram,
        role,
      } = req.body;

      // Optional: Validate required fields
      if (
        !eventId ||
        !fullName ||
        !studentNumber ||
        !schoolEmail ||
        !yearLevel
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const registration = await prisma.registration.create({
        data: {
          eventId,
          userId: userId || null,
          fullName,
          studentNumber,
          schoolEmail,
          contactNumber: contactNumber || "",
          facebookLink: facebookLink || "",
          yearLevel: Number(yearLevel),
          section: section || "",
          professor: professor || "",
          degreeProgram: degreeProgram || "",
          role: role || "NON_MEMBER", // Default role
        },
      });

      res.status(201).json(registration);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create registration" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
