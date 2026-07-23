// Seeds the 2526 validated membership database.
// Password rule: each member's password is their CONTACT NO.
// If the contact number is malformed (not 09XXXXXXXXX), fall back to "ACM2526".
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { Readable } from "stream";
import csv from "csv-parser";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SRC =
  "C:/Users/luigi/Downloads/[ACM2526] Raw Membership Database - Validated by Finance & Secre.csv";

const PHONE_RE = /^09\d{9}$/;
const norm = (s) => (s ?? "").toString().trim();

async function main() {
  // The raw export has an empty first line; drop it so row 2 becomes the header.
  const raw = fs.readFileSync(SRC, "utf8");
  const body = raw.slice(raw.indexOf("\n") + 1);

  const rows = [];
  await new Promise((resolve, reject) => {
    Readable.from(body)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, " "),
        })
      )
      .on("data", (d) => rows.push(d))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`📊 Parsed ${rows.length} members`);

  let inserted = 0;
  let fallbackPw = 0;
  const failures = [];

  for (const m of rows) {
    const studentId = norm(m["student id"]);
    const personalEmail = norm(m["personal email address"]);
    const contact = norm(m["contact no."]);

    if (!studentId || !personalEmail) {
      failures.push({ studentId: studentId || "(none)", reason: "missing id/email" });
      continue;
    }

    // Password = phone number, or ACM2526 when the phone number is malformed.
    const usesFallback = !PHONE_RE.test(contact);
    if (usesFallback) fallbackPw++;
    const plainPw = usesFallback ? "ACM2526" : contact;
    const password = await bcrypt.hash(plainPw, 10);

    try {
      await prisma.user.create({
        data: {
          firstName: norm(m["first name"]),
          middleName: norm(m["middle name"]),
          lastName: norm(m["surname"]),
          suffix: norm(m["suffix"]) || null,
          personalEmail,
          schoolEmail: norm(m["fit email"]),
          contactNumber: contact,
          facebookLink: norm(m["facbook link"]),
          studentId,
          yearLevel: parseInt(m["year level"]) || 0,
          degreeProgram: norm(m["degree program"]),
          password,
        },
      });
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`✅ Inserted ${inserted}/${rows.length}...`);
      }
    } catch (err) {
      failures.push({
        studentId,
        email: personalEmail,
        reason: err.meta?.target || err.message,
      });
    }
  }

  console.log(`\n🎉 Done! Inserted ${inserted}/${rows.length} members.`);
  console.log(`🔑 ${fallbackPw} members got the ACM2526 fallback password (malformed phone).`);
  if (failures.length) {
    console.log(`\n⚠️ ${failures.length} failures:`);
    for (const f of failures) console.log("  -", JSON.stringify(f));
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Seeder error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
