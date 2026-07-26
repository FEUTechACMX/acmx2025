/**
 * Merchandise — shared vocabulary for the store, the cart and the console.
 *
 * Availability is deliberately ONE three-way choice rather than a pile of
 * loose switches: an item is AVAILABLE, SOLD_OUT, or HIDDEN. Sold out is not
 * an error state — it renders in neutral greys, never in `danger`.
 */

export const MERCH_STATUSES = ["AVAILABLE", "SOLD_OUT", "HIDDEN"] as const;
export type MerchStatus = (typeof MERCH_STATUSES)[number];

export const MERCH_CATEGORIES = ["APPAREL", "ACCESSORIES", "STICKERS", "STATIONERY"] as const;
export type MerchCategory = (typeof MERCH_CATEGORIES)[number];

export const MERCH_ORDER_STATUSES = ["PENDING", "READY", "COLLECTED", "CANCELLED"] as const;
export type MerchOrderStatus = (typeof MERCH_ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<MerchStatus, string> = {
  AVAILABLE: "Available",
  SOLD_OUT: "Sold out",
  HIDDEN: "Hidden",
};

/** What each availability choice actually does — shown under the radio in the editor. */
export const STATUS_NOTES: Record<MerchStatus, string> = {
  AVAILABLE: "Listed on the store and reservable while stock lasts.",
  SOLD_OUT: "Stays listed and readable, greyed and un-reservable. Members can ask to be notified.",
  HIDDEN: "Pulled off the public store. The record and its reservations are kept.",
};

export const ORDER_STATUS_LABELS: Record<MerchOrderStatus, string> = {
  PENDING: "Pending",
  READY: "Ready",
  COLLECTED: "Collected",
  CANCELLED: "Cancelled",
};

/** Days a checkout holds the units before an officer may release them. */
export const HOLD_DAYS = 3;

/** Per-variant reservation ceiling, so one member can't clear a size. */
export const MAX_PER_VARIANT = 5;

/* ── Wire shapes ────────────────────────────────────────────── */

export type MerchVariantDTO = {
  id: string;
  label: string;
  stock: number;
  soldOut: boolean;
  /** Derived: `soldOut || stock <= 0`. Never trust the raw count in the UI. */
  available: boolean;
};

export type MerchItemDTO = {
  id: string;
  slug: string;
  name: string;
  category: MerchCategory;
  blurb: string | null;
  description: string | null;
  price: number;
  images: string[];
  status: MerchStatus;
  isNewDrop: boolean;
  order: number;
  pickupNote: string | null;
  paymentNote: string | null;
  restockNote: string | null;
  variants: MerchVariantDTO[];
  /** Derived: status is SOLD_OUT, or no variant has stock left. */
  soldOut: boolean;
  /** Total units left across variants. */
  stock: number;
};

export type CartLineDTO = {
  id: string;
  quantity: number;
  variantId: string;
  variantLabel: string;
  /** Units still purchasable for this line's variant. */
  variantStock: number;
  unitPrice: number;
  itemId: string;
  itemName: string;
  itemSlug: string;
  itemImage: string | null;
  /** False when the item went sold-out/hidden, or stock dropped below the quantity. */
  purchasable: boolean;
};

export type CartDTO = {
  lines: CartLineDTO[];
  /** Sum over purchasable lines only. */
  subtotal: number;
  count: number;
  /** Lines that can no longer be checked out and need the member's attention. */
  blocked: number;
};

export type OrderLineDTO = {
  id: string;
  itemName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
};

export type OrderDTO = {
  id: string;
  reference: string;
  status: MerchOrderStatus;
  total: number;
  note: string | null;
  createdAt: string;
  expiresAt: string;
  lines: OrderLineDTO[];
  /** Present on the admin view only. */
  member?: { name: string; studentId: string; email: string };
};

/* ── Formatting ─────────────────────────────────────────────── */

/** Peso, no decimals unless the price actually has centavos. */
export function peso(amount: number): string {
  const whole = Number.isInteger(amount);
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * The line under the price on a storefront card. Mirrors the design:
 * the size run when there is one, "One size" when there isn't, a low-stock
 * count when it's getting tight, and a restock line once it's gone.
 */
export function stockNote(item: Pick<MerchItemDTO, "variants" | "soldOut" | "restockNote">): {
  text: string;
  tone: "muted" | "accent" | "faint";
} {
  if (item.soldOut) return { text: item.restockNote || "Restock TBA", tone: "faint" };

  const live = item.variants.filter((v) => v.available);
  const left = live.reduce((n, v) => n + v.stock, 0);

  if (left > 0 && left <= 5) return { text: `ONLY ${left} LEFT`, tone: "accent" };
  if (live.length === 1 && isOneSize(live[0].label)) return { text: "One size", tone: "muted" };
  return { text: live.map((v) => v.label).join(" · "), tone: "muted" };
}

const ONE_SIZE_LABELS = ["one size", "onesize", "default", "standard"];

export function isOneSize(label: string): boolean {
  return ONE_SIZE_LABELS.includes(label.trim().toLowerCase());
}

/** Slug from a product name: "Chapter Tee — Black" → "chapter-tee-black". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
