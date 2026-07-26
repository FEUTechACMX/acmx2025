"use client";

import { useCallback, useEffect, useState } from "react";
import type { CartDTO } from "@/types/merch";

/**
 * The cart lives on the server (see `MerchCartLine`), so the client keeps no
 * copy of truth — every mutation returns the re-validated basket and we hand
 * that straight back. A window event lets the nav badge and the cart page stay
 * in step without threading a provider through the root layout.
 */

const CART_EVENT = "acmx:cart";

export const EMPTY_CART: CartDTO = { lines: [], subtotal: 0, count: 0, blocked: 0 };

export type CartResult = { ok: true; cart: CartDTO; capped?: boolean } | { ok: false; error: string };

function broadcast(cart: CartDTO) {
  window.dispatchEvent(new CustomEvent<CartDTO>(CART_EVENT, { detail: cart }));
}

async function call(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  query = ""
): Promise<CartResult> {
  try {
    const res = await fetch(`/api/merch/cart${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 401 is the signed-out case, not a failure worth shouting about.
      return { ok: false, error: data?.error || "Something went wrong." };
    }

    const cart: CartDTO = data.cart ?? EMPTY_CART;
    broadcast(cart);
    return { ok: true, cart, capped: Boolean(data.capped) };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

export const getCart = () => call("GET");
export const addToCart = (variantId: string, quantity = 1) =>
  call("POST", { variantId, quantity });
export const setCartQuantity = (lineId: string, quantity: number) =>
  call("PATCH", { lineId, quantity });
export const removeCartLine = (lineId: string) =>
  call("DELETE", undefined, `?lineId=${encodeURIComponent(lineId)}`);
export const clearCart = () => call("DELETE");

/** Tells every mounted cart listener to take a fresh basket (used after checkout). */
export function publishCart(cart: CartDTO) {
  broadcast(cart);
}

/**
 * Subscribes to the basket. `enabled` is false for signed-out visitors so we
 * don't fire a guaranteed-401 on every page load.
 */
export function useCart(enabled = true) {
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const res = await getCart();
    if (res.ok) setCart(res.cart);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onCart = (e: Event) => setCart((e as CustomEvent<CartDTO>).detail);
    window.addEventListener(CART_EVENT, onCart);
    return () => window.removeEventListener(CART_EVENT, onCart);
  }, []);

  return { cart, loading, refresh };
}
