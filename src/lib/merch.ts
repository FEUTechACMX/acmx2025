import type { MerchItem, MerchVariant, MerchOrder, MerchOrderLine } from "@prisma/client";
import type {
  CartDTO,
  MerchItemDTO,
  MerchVariantDTO,
  OrderDTO,
  MerchCategory,
  MerchStatus,
} from "@/types/merch";
import { HOLD_DAYS, MERCH_CATEGORIES, MERCH_STATUSES, slugify } from "@/types/merch";
import { prisma } from "./prisma";

/** Variants always come back in editor order, then alphabetically. */
export const variantOrder = [{ order: "asc" as const }, { label: "asc" as const }];

/* ── Payload validation ─────────────────────────────────────────
 *
 * `readVariants`, `readCategory` and `readStatus` below are *coercers*: they take
 * anything and produce something safe, defaulting silently. That is right for an
 * absent field and wrong for a present-but-invalid one — an officer who mistypes
 * a category should be told, not quietly given APPAREL. So the route validates
 * what was actually sent, then coerces (CLEANUP.md §6.4).
 *
 * The caps exist because nothing bounded these strings: `name`, the three notes,
 * and the image list were written to the database at whatever length arrived.
 */

export const ITEM_LIMITS = {
  name: 160,
  slug: 160,
  blurb: 300,
  description: 8000,
  note: 2000,
  imageUrl: 600,
  images: 24,
  variants: 40,
  variantLabel: 40,
  stock: 100_000,
  price: 1_000_000,
} as const;

/**
 * Validates a merch item payload. Only keys present in `body` are checked, so it
 * serves both the create route and the PATCH editor. Returns the first problem
 * as a sentence, or null.
 */
export function validateItemInput(body: Record<string, unknown>): string | null {
  const text = (key: string, label: string, max: number) => {
    if (body[key] === undefined || body[key] === null) return null;
    if (typeof body[key] !== "string") return `${label} must be text.`;
    return (body[key] as string).trim().length > max
      ? `${label} must be ${max} characters or fewer.`
      : null;
  };

  const problems = [
    text("name", "Name", ITEM_LIMITS.name),
    text("slug", "Slug", ITEM_LIMITS.slug),
    text("blurb", "Blurb", ITEM_LIMITS.blurb),
    text("description", "Description", ITEM_LIMITS.description),
    text("pickupNote", "Pickup note", ITEM_LIMITS.note),
    text("paymentNote", "Payment note", ITEM_LIMITS.note),
    text("restockNote", "Restock note", ITEM_LIMITS.note),
  ];
  const firstText = problems.find(Boolean);
  if (firstText) return firstText;

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return "Price must be zero or more.";
    if (price > ITEM_LIMITS.price) return "That price looks like a typo.";
  }

  if (body.category !== undefined && !MERCH_CATEGORIES.includes(body.category as MerchCategory)) {
    return `Category must be one of: ${MERCH_CATEGORIES.join(", ")}.`;
  }

  if (body.status !== undefined && !MERCH_STATUSES.includes(body.status as MerchStatus)) {
    return `Status must be one of: ${MERCH_STATUSES.join(", ")}.`;
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) return "Images must be a list.";
    if (body.images.length > ITEM_LIMITS.images)
      return `An item can hold at most ${ITEM_LIMITS.images} photos.`;
    if (body.images.some((i) => typeof i !== "string"))
      return "Every image must be a URL string.";
    if (body.images.some((i) => (i as string).length > ITEM_LIMITS.imageUrl))
      return `Image URLs must be ${ITEM_LIMITS.imageUrl} characters or fewer.`;
  }

  if (body.variants !== undefined) {
    if (!Array.isArray(body.variants)) return "Variants must be a list.";
    if (body.variants.length > ITEM_LIMITS.variants)
      return `An item can hold at most ${ITEM_LIMITS.variants} sizes.`;
    for (const v of body.variants) {
      const variant = (v ?? {}) as Record<string, unknown>;
      const label = String(variant.label ?? "").trim();
      if (label.length > ITEM_LIMITS.variantLabel)
        return `Size labels must be ${ITEM_LIMITS.variantLabel} characters or fewer.`;
      if (variant.stock !== undefined) {
        const stock = Number(variant.stock);
        if (!Number.isFinite(stock)) return `Stock for "${label}" must be a number.`;
        if (stock > ITEM_LIMITS.stock) return `Stock for "${label}" looks like a typo.`;
      }
    }
  }

  return null;
}

export type ItemWithVariants = MerchItem & { variants: MerchVariant[] };

export function serializeVariant(v: MerchVariant): MerchVariantDTO {
  return {
    id: v.id,
    label: v.label,
    stock: v.stock,
    soldOut: v.soldOut,
    available: !v.soldOut && v.stock > 0,
  };
}

/**
 * An item is sold out when the admin said so, or when every variant has run
 * dry. The second case is what makes the store self-maintaining: officers set
 * stock, and the card greys itself out without anyone flipping a switch.
 */
export function serializeItem(item: ItemWithVariants): MerchItemDTO {
  const variants = item.variants.map(serializeVariant);
  const stock = variants.reduce((n, v) => n + (v.available ? v.stock : 0), 0);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category as MerchCategory,
    blurb: item.blurb,
    description: item.description,
    price: item.price,
    images: item.images,
    status: item.status as MerchStatus,
    isNewDrop: item.isNewDrop,
    order: item.order,
    pickupNote: item.pickupNote,
    paymentNote: item.paymentNote,
    restockNote: item.restockNote,
    variants,
    soldOut: item.status === "SOLD_OUT" || stock === 0,
    stock,
  };
}

export function serializeOrder(
  order: MerchOrder & {
    lines: MerchOrderLine[];
    user?: { firstName: string; lastName: string; studentId: string; schoolEmail: string } | null;
  }
): OrderDTO {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    total: order.total,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    lines: order.lines.map((l) => ({
      id: l.id,
      itemName: l.itemName,
      variantLabel: l.variantLabel,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    })),
    member: order.user
      ? {
          name: `${order.user.firstName} ${order.user.lastName}`.trim(),
          studentId: order.user.studentId,
          email: order.user.schoolEmail,
        }
      : undefined,
  };
}

/**
 * Reads a member's basket and re-checks every line against live stock.
 *
 * The cart is deliberately not a snapshot: an item can go sold out or hidden,
 * or another member can take the last unit, between adding and checking out.
 * Those lines come back `purchasable: false` so the cart page can surface them
 * instead of failing at checkout.
 */
export async function loadCart(userId: string): Promise<CartDTO> {
  const lines = await prisma.merchCartLine.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { variant: { include: { item: true } } },
  });

  const mapped = lines.map((line) => {
    const { variant } = line;
    const { item } = variant;
    const purchasable =
      item.status === "AVAILABLE" && !variant.soldOut && variant.stock >= line.quantity;

    return {
      id: line.id,
      quantity: line.quantity,
      variantId: variant.id,
      variantLabel: variant.label,
      variantStock: variant.soldOut ? 0 : variant.stock,
      unitPrice: item.price,
      itemId: item.id,
      itemName: item.name,
      itemSlug: item.slug,
      itemImage: item.images[0] ?? null,
      purchasable,
    };
  });

  return {
    lines: mapped,
    subtotal: mapped.reduce((sum, l) => (l.purchasable ? sum + l.unitPrice * l.quantity : sum), 0),
    count: mapped.reduce((n, l) => n + l.quantity, 0),
    blocked: mapped.filter((l) => !l.purchasable).length,
  };
}

/** End of the hold window for a checkout made now. */
export function holdExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + HOLD_DAYS);
  return d;
}

/* ── Admin input normalisation ──────────────────────────────── */

export type VariantInput = { label: string; stock: number; soldOut: boolean };

/** Normalises the variant rows posted by the editor: trimmed, de-duped, capped at zero. */
export function readVariants(raw: unknown): VariantInput[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: VariantInput[] = [];

  for (const v of raw) {
    const label = String(v?.label ?? "").trim().toUpperCase();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({
      label,
      stock: Math.max(0, Math.trunc(Number(v?.stock) || 0)),
      soldOut: Boolean(v?.soldOut),
    });
  }
  return out;
}

export function readStatus(raw: unknown): MerchStatus {
  return MERCH_STATUSES.includes(raw as MerchStatus) ? (raw as MerchStatus) : "AVAILABLE";
}

export function readCategory(raw: unknown): MerchCategory {
  return MERCH_CATEGORIES.includes(raw as MerchCategory) ? (raw as MerchCategory) : "APPAREL";
}

/** Appends -2, -3, … until the slug is free. */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let n = 2; ; n++) {
    const clash = await prisma.merchItem.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === exceptId) return candidate;
    candidate = `${root}-${n}`;
  }
}

const REF_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3456789";

/**
 * Short reference the member quotes at the ACM room — "ACM-7K4P2X".
 * Ambiguous glyphs (0/O, 1/I, S/5, B/8, 2/Z) are out of the alphabet so codes
 * survive being read aloud or copied off a phone screen.
 */
export function orderReference(): string {
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `ACM-${body}`;
}
