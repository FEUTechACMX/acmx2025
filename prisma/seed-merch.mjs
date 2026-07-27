import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The eight items from the merchandise redesign, so a fresh database opens on a
// stocked store instead of an empty grid. Re-running this is safe: items are
// upserted by slug and variant stock is reset to these numbers.
const items = [
  {
    slug: "chapter-tee-black",
    name: "Chapter Tee — Black",
    category: "APPAREL",
    price: 450,
    isNewDrop: true,
    order: 1,
    blurb: "Heavyweight cotton tee in chapter black.",
    description:
      "Heavyweight cotton tee in chapter black, screen-printed with the diamond mark on the chest and the ACM wordmark across the back. Unisex fit, pre-shrunk. Designed by the 2026 creatives committee.",
    variants: [
      { label: "S", stock: 5 },
      { label: "M", stock: 4 },
      { label: "L", stock: 3 },
      { label: "XL", stock: 0, soldOut: true },
    ],
  },
  {
    slug: "acm-hoodie-concrete",
    name: "ACM Hoodie — Concrete",
    category: "APPAREL",
    price: 1250,
    status: "SOLD_OUT",
    order: 2,
    restockNote: "Restock TBA",
    description:
      "Brushed-fleece hoodie in concrete grey with a tonal diamond embroidery on the chest. Boxy unisex cut.",
    variants: [
      { label: "S", stock: 0 },
      { label: "M", stock: 0 },
      { label: "L", stock: 0 },
      { label: "XL", stock: 0 },
    ],
  },
  {
    slug: "lanyard-orchid",
    name: "Lanyard — Orchid",
    category: "ACCESSORIES",
    price: 120,
    order: 3,
    description:
      "Woven lanyard in the chapter orchid with a metal clip and a breakaway clasp. Fits any student ID sleeve.",
    variants: [{ label: "ONE SIZE", stock: 40 }],
  },
  {
    slug: "sticker-pack-vol-1",
    name: "Sticker Pack — Vol. 1",
    category: "STICKERS",
    price: 90,
    order: 4,
    blurb: "6 pieces",
    description:
      "Six die-cut vinyl stickers: the diamond mark, the ACM wordmark, and four in-jokes only the chapter will get. Weatherproof, laptop-safe.",
    variants: [{ label: "ONE SIZE", stock: 60 }],
  },
  {
    slug: "diamond-pin",
    name: "Diamond Pin",
    category: "ACCESSORIES",
    price: 180,
    status: "SOLD_OUT",
    order: 5,
    restockNote: "Restock TBA",
    description: "Hard-enamel pin of the diamond mark, orchid on brushed steel. Butterfly clutch.",
    variants: [{ label: "ONE SIZE", stock: 0 }],
  },
  {
    slug: "cs-night-shirt-limited",
    name: "CS Night Shirt — Limited",
    category: "APPAREL",
    price: 520,
    order: 6,
    description:
      "Limited run for CS Night. Long-sleeve cotton with the event mark on the sleeve. Once these are gone they are gone.",
    variants: [
      { label: "S", stock: 1 },
      { label: "M", stock: 2 },
      { label: "L", stock: 1 },
    ],
  },
  {
    slug: "tote-hard-corners",
    name: "Tote — Hard Corners",
    category: "ACCESSORIES",
    price: 300,
    order: 7,
    description:
      "Canvas tote with a squared base and reinforced handles. Screen-printed hairline grid, one side only.",
    variants: [{ label: "ONE SIZE", stock: 25 }],
  },
  {
    slug: "notebook-grid-a5",
    name: "Notebook — Grid A5",
    category: "STATIONERY",
    price: 210,
    order: 8,
    blurb: "Ruled · 80 pages",
    description: "A5 notebook, 80 grid pages, lay-flat binding and a concrete-grey board cover.",
    variants: [{ label: "ONE SIZE", stock: 30 }],
  },
];

async function main() {
  for (const { variants, ...item } of items) {
    const saved = await prisma.merchItem.upsert({
      where: { slug: item.slug },
      create: item,
      update: item,
    });

    for (const [i, v] of variants.entries()) {
      const data = { stock: v.stock, soldOut: Boolean(v.soldOut), order: i };
      await prisma.merchVariant.upsert({
        where: { itemId_label: { itemId: saved.id, label: v.label } },
        create: { itemId: saved.id, label: v.label, ...data },
        update: data,
      });
    }

    console.log(`✓ ${item.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
