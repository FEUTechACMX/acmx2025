import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("2025ACM", 10);
  const results: any[] = [];

  // ✅ Direct relative path (no variable)
  fs.createReadStream("prisma/seed/members.csv")
    .pipe(
      csv({
        // Normalize headers → lowercase + single spaces
        mapHeaders: ({ header }) =>
          header.trim().toLowerCase().replace(/\s+/g, " "),
      })
    )
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log(`📊 Parsed ${results.length} members`);
      console.log("🧩 Headers detected:", Object.keys(results[0]));

      let inserted = 0;
      console.log("First row sample:", results[0]);
      console.log("All headers:", Object.keys(results[0]));

      for (const m of results) {
        const email = m["personal email address"]?.trim();
        const studentId = m["student id"]?.trim();

        if (!email) {
          console.warn(
            `⚠️ Skipping ${studentId || "(no ID)"} - No personal email`
          );
          continue;
        }

        try {
          await prisma.user.create({
            data: {
              firstName: m["first name"]?.trim() || "",
              middleName: m["middle name"]?.trim() || "",
              lastName: m["surname"]?.trim() || "",
              personalEmail: email,
              schoolEmail: m["fit email"]?.trim() || "",
              contactNumber: m["contact no."]?.trim() || "",
              facebookLink: m["facbook link"]?.trim() || "",
              discordName: m["discord username"]?.trim() || "",
              studentId,
              yearLevel: parseInt(m["year level"]) || 0,
              degreeProgram: m["degree program"]?.trim() || "",
              password: hash,
            },
          });

          inserted++;
          if (inserted % 50 === 0) {
            console.log(`✅ Inserted ${inserted}/${results.length} members...`);
          }
        } catch (err: any) {
          console.error(
            `❌ Failed to insert ${studentId} (${email}):`,
            err.meta?.target || err.message
          );
        }
      }

      console.log(
        `🎉 Done! Successfully inserted ${inserted}/${results.length} members.`
      );
      await prisma.$disconnect();
      process.exit();
    });
}

main().catch(async (err) => {
  console.error("❌ Seeder error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
