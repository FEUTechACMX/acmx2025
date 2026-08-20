/**
 * Membership Drive prices — single source of truth.
 * UI reads from here; never hardcode a peso figure in a component.
 */
import type { BundleKindValue } from "@/lib/membership";

export type MembershipKind = "NEW" | "RENEWAL";

/** Bundle total in ₱ (integers). `null` = unconfirmed — UI shows "Price TBA". */
export const MEMBERSHIP_PRICE: Record<
  MembershipKind,
  Record<BundleKindValue, number | null>
> = {
  NEW: {
    SOLO: 300,
    // TODO(pricing): confirm Partner Org price (pending).
    PARTNER: null,
    BUNDLE_5: 1400,
    BUNDLE_8: 2000,
  },
  RENEWAL: {
    SOLO: 250,
    // TODO(pricing): confirm Partner Org price (pending).
    PARTNER: null,
    BUNDLE_5: 1150,
    BUNDLE_8: 1600,
  },
};

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}
