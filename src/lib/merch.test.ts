import { describe, expect, it, vi } from "vitest";

// `lib/merch` imports prisma at module scope for its slug helper; the validator
// under test never touches the database.
vi.mock("./prisma", () => ({ prisma: {} }));

const { validateItemInput, ITEM_LIMITS } = await import("./merch");

const ok = (body: Record<string, unknown>) => expect(validateItemInput(body)).toBeNull();
const fails = (body: Record<string, unknown>, match: RegExp) =>
  expect(validateItemInput(body)).toMatch(match);

describe("validateItemInput — absent fields", () => {
  it("passes an empty payload, because PATCH sends only what changed", () => {
    ok({});
  });

  it("passes a minimal create payload", () => {
    ok({ name: "ACM Shirt", price: 450 });
  });
});

describe("text limits", () => {
  it("accepts a name at the cap and rejects one over it", () => {
    ok({ name: "x".repeat(ITEM_LIMITS.name) });
    fails({ name: "x".repeat(ITEM_LIMITS.name + 1) }, /160 characters or fewer/);
  });

  it("rejects non-string text fields rather than coercing them", () => {
    fails({ name: 42 }, /must be text/);
    fails({ description: { any: "object" } }, /must be text/);
  });

  it("caps each note independently", () => {
    for (const key of ["pickupNote", "paymentNote", "restockNote"]) {
      fails({ [key]: "x".repeat(ITEM_LIMITS.note + 1) }, /characters or fewer/);
    }
  });

  it("treats null as absent", () => {
    ok({ blurb: null, description: null, pickupNote: null });
  });
});

describe("price", () => {
  it("accepts zero and normal amounts", () => {
    ok({ price: 0 });
    ok({ price: "450" });
  });

  it("rejects negatives and NaN", () => {
    fails({ price: -1 }, /zero or more/);
    fails({ price: "free" }, /zero or more/);
  });

  it("rejects an implausible amount as a likely typo", () => {
    fails({ price: ITEM_LIMITS.price + 1 }, /typo/);
  });
});

describe("category and status", () => {
  it("rejects an unrecognised category instead of silently defaulting", () => {
    // `readCategory` would quietly return APPAREL, so a typo used to be invisible.
    fails({ category: "APPARELL" }, /Category must be one of/);
  });

  it("rejects an unrecognised status", () => {
    fails({ status: "AVAILIBLE" }, /Status must be one of/);
  });

  it("accepts the real values", () => {
    ok({ category: "APPAREL" });
    ok({ status: "AVAILABLE" });
  });
});

describe("images", () => {
  it("rejects a bare string where a list belongs", () => {
    fails({ images: "one.png" }, /must be a list/);
  });

  it("rejects non-string entries", () => {
    fails({ images: ["ok.png", 7] }, /URL string/);
  });

  it("caps the count and the URL length", () => {
    fails({ images: Array(ITEM_LIMITS.images + 1).fill("a.png") }, /at most/);
    fails({ images: ["x".repeat(ITEM_LIMITS.imageUrl + 1)] }, /characters or fewer/);
  });

  it("accepts an empty list", () => {
    ok({ images: [] });
  });
});

describe("variants", () => {
  it("rejects a non-list", () => {
    fails({ variants: "M" }, /must be a list/);
  });

  it("caps the number of sizes", () => {
    fails(
      { variants: Array(ITEM_LIMITS.variants + 1).fill({ label: "M", stock: 1 }) },
      /at most/
    );
  });

  it("caps the label length", () => {
    fails({ variants: [{ label: "x".repeat(ITEM_LIMITS.variantLabel + 1) }] }, /Size labels/);
  });

  it("rejects unparseable stock and implausible stock", () => {
    fails({ variants: [{ label: "M", stock: "loads" }] }, /must be a number/);
    fails({ variants: [{ label: "M", stock: ITEM_LIMITS.stock + 1 }] }, /typo/);
  });

  it("survives null entries in the list", () => {
    ok({ variants: [null] });
  });

  it("accepts a normal variant set", () => {
    ok({ variants: [{ label: "S", stock: 4 }, { label: "M", stock: 0, soldOut: true }] });
  });
});
