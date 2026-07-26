// One-off: promote Luigi Karl B. Limos to ADMIN.
// Loads DATABASE_URL from .env, finds the user, updates role only when the
// match is unambiguous.
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const matches = await prisma.user.findMany({
    where: {
      firstName: { contains: "Luigi", mode: "insensitive" },
      lastName: { contains: "Limos", mode: "insensitive" },
    },
  });

  console.log(
    "Matches:",
    matches.map((u) => ({
      id: u.id,
      name: [u.firstName, u.middleName, u.lastName, u.suffix]
        .filter(Boolean)
        .join(" "),
      studentId: u.studentId,
      role: u.role,
    }))
  );

  if (matches.length !== 1) {
    console.log(`Expected exactly 1 match, found ${matches.length}. Not updating.`);
    process.exitCode = 2;
    return;
  }

  const updated = await prisma.user.update({
    where: { id: matches[0].id },
    data: { role: "ADMIN" },
  });
  console.log(`Updated "${updated.firstName} ${updated.lastName}" -> role=${updated.role}`);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
