// scripts/build-president-doc.mjs
//
// Emits `PRESIDENT-role-access-review.docx` at the repo root — the editable Word
// doc Fathi sends to the President to ratify officer access levels. The President
// edits it directly (including the blank "Future JO Roles" table) and sends back.
//
// Usage:  node scripts/build-president-doc.mjs
//         npm run docs:president   (if wired in package.json)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outDocx = path.join(repoRoot, "docs", "PRESIDENT-role-access-review.docx");

const PURPLE = "9B2FBE";
const YELLOW = "B8860B";

// ── Content ────────────────────────────────────────────────────────────────
const accessLadder = [
  ["Administrator", "Full control of the whole system (technical)."],
  ["Executive Leadership", "Full run of the admin console (President, VPs)."],
  ["Secretariat", "Member records, on-site registration, secretarial tools."],
  ["Head of Finance", "Oversee chapter finance (Treasurer)."],
  ["Director", "Manage events, committees, and content for their area."],
  ["Media Director", "Manage media, creatives, publications, and content."],
  ["Media Officer", "Media tasks, more limited."],
  ["Junior Officer", "Assist within their area, limited access."],
];

const officers = [
  ["Angelo Roy Whitty", "President", "Executive Leadership"],
  ["Aaron Gabriel Claro", "VP – Internal", "Executive Leadership"],
  ["Jecyn Vallirie Turbanos", "VP – External", "Executive Leadership"],
  ["Trisha Mikaella Angeles", "Secretary", "Secretariat"],
  ["Andrei Gio Catalan", "Associate Secretary", "Junior Officer (Secretariat)"],
  ["John Carlo Salvador", "Treasurer", "Head of Finance"],
  ["Klezzel Arvee Usana", "Auditor", "Finance — your call (see notes)"],
  ["Dazzle Jean Alcordo", "Director for Events", "Director"],
  ["Francheska Lyka Barrientos", "Director for Logistics", "Director"],
  ["Charles Lester Ferrer", "Assoc. Director for Logistics", "Junior Officer"],
  ["Lorraine Nicole Co", "Public Relations Officer", "Director"],
  ["Reese Chan", "Director for Academics", "Director"],
  ["Sophia Maxine Sinang", "Director for Creatives", "Media Director"],
  ["Laarnie Pervara", "Assoc. Director for Creatives", "Media Officer"],
  ["Daniela Torres", "Director for Media", "Media Director"],
  ["Sky Gabriel Reas", "Director for Outreach", "Director"],
  ["Kent Anthony Capuno", "Director for Publications", "Media Director"],
  ["Rafael Marcuz Ibana", "Director for Publicity", "Media Director"],
  ["Syril Marie Celis", "Director for External Affairs", "Director"],
  ["Fathi Mahad Ebrahim", "Webmaster", "Administrator"],
];

// ── docx helpers ─────────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" };
const cellBorders = {
  top: cellBorder,
  bottom: cellBorder,
  left: cellBorder,
  right: cellBorder,
};

const cell = (text, { bold = false, header = false, widthPct } = {}) =>
  new TableCell({
    borders: cellBorders,
    shading: header ? { fill: "F0E6F5" } : undefined,
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: bold || header })],
      }),
    ],
  });

const table = (headers, rows, widths) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          cell(h, { header: true, widthPct: widths?.[i] })
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(c, { widthPct: widths?.[i] })),
          })
      ),
    ],
  });

const h1 = (text) =>
  new Paragraph({ text, heading: HeadingLevel.TITLE, spacing: { after: 120 } });

const h2 = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    border: {
      bottom: { color: PURPLE, size: 6, space: 4, style: BorderStyle.SINGLE },
    },
  });

const p = (runs, opts = {}) =>
  new Paragraph({
    children: Array.isArray(runs) ? runs : [new TextRun(runs)],
    spacing: { after: 140 },
    ...opts,
  });

const bullet = (text) =>
  new Paragraph({
    children: [new TextRun(text)],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });

const numbered = (text) =>
  new Paragraph({
    children: [new TextRun(text)],
    numbering: { reference: "pres-ol", level: 0 },
    spacing: { after: 80 },
  });

const spacer = () => new Paragraph({ text: "", spacing: { after: 60 } });

// ── Build ────────────────────────────────────────────────────────────────────
const children = [
  h1("ACMX Portal — Officer Access Review"),
  p([
    new TextRun({ text: "For: ", bold: true }),
    new TextRun("President Angelo Roy Whitty"),
  ]),
  p([
    new TextRun({ text: "From: ", bold: true }),
    new TextRun("Fathi (Webmaster) & the build team    "),
    new TextRun({ text: "Date: ", bold: true }),
    new TextRun("2026-08-20"),
  ]),
  p(
    "Hi Angelo — before the officers start using the portal after the demo, we need your sign-off on who gets what access. You own this decision, so nothing is final until you confirm. This should take about five minutes; no technical knowledge needed."
  ),

  h2("How access works (the short version)"),
  p(
    "The portal has a set of access levels. Every officer is placed in one, and that level decides which admin tools they can see and use. Higher levels can do more. Here is the ladder in plain terms:"
  ),
  table(["Access level", "What it lets you do"], accessLadder, [30, 70]),
  spacer(),

  h2("Proposed placement for the 20 officers"),
  p([
    new TextRun("This is our "),
    new TextRun({ text: "suggestion", italics: true }),
    new TextRun(" — please change anything you disagree with."),
  ]),
  table(["Officer", "Position", "Proposed access level"], officers, [34, 34, 32]),
  spacer(),

  h2("Decisions we need from you"),
  p([
    new TextRun({ text: "1. The Auditor. ", bold: true }),
    new TextRun(
      "We've placed the Treasurer as Head of Finance. Where should the Auditor sit — the same finance level as the Treasurer, or a separate oversight level? (Currently the system has one finance level; we can add a dedicated one if you want the Auditor separated.)"
    ),
  ]),
  p([
    new TextRun({ text: "2. The Directors share access levels. ", bold: true }),
    new TextRun(
      "All line directors fall into “Director” or “Media Director,” so they can do the same things at that level. If you want certain directors to have more or fewer permissions than others, tell us which."
    ),
  ]),

  h2("Future JO (Junior Officer) roles — for you to fill in later"),
  p([
    new TextRun(
      "When the Junior Officers for the committees are finalized, add them here — name, position, committee, and the access level you want them to have. We'll set them up from this table. "
    ),
    new TextRun({
      text: "(Leave blank for now; edit this document when ready.)",
      italics: true,
      color: YELLOW,
    }),
  ]),
  table(
    ["Name", "Position", "Committee", "Access level"],
    Array.from({ length: 8 }, () => ["", "", "", ""]),
    [28, 24, 24, 24]
  ),
  spacer(),

  h2("What we need back from you"),
  numbered("Confirm or edit the access levels in the tables above."),
  numbered("Answer the two questions about the Auditor and the Directors."),
  p([
    new TextRun(
      "Once you confirm, each officer receives a secure email to their @fit.edu.ph address to set their own password, and they're in. Thanks, Angelo!"
    ),
  ]),
];

const doc = new Document({
  creator: "ACMX",
  title: "ACMX Officer Access Review",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
  },
  numbering: {
    config: [
      {
        reference: "pres-ol",
        levels: [
          {
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: 480, hanging: 300 } } },
          },
        ],
      },
    ],
  },
  sections: [{ properties: {}, children }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outDocx, buffer);
console.log(
  `✓ Wrote ${path.relative(repoRoot, outDocx)} (${(buffer.length / 1024).toFixed(1)} KB)`
);
