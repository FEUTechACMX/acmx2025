"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Surface, Column, PageHeader, Body, Label, Rule, useDS } from "@/components/ds";
import { type as t, layout, motion } from "@/styles/design-system";
import Icon from "@/components/admin/icons";
import {
  HOLD_DAYS,
  MAX_PER_VARIANT,
  ORDER_STATUS_LABELS,
  peso,
  type CartLineDTO,
  type OrderDTO,
} from "@/types/merch";
import {
  clearCart,
  publishCart,
  removeCartLine,
  setCartQuantity,
  useCart,
  EMPTY_CART,
} from "./cartClient";

export default function CartPage() {
  const { c } = useDS();
  const { cart, loading } = useCart(true);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<OrderDTO | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/merch/orders");
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setOrders(data.orders ?? []);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function checkout() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/merch/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(data?.error || "Checkout failed.");
      if (data?.cart) publishCart(data.cart);
      return;
    }

    // The basket is consumed server-side, so tell every listener it's empty.
    publishCart(EMPTY_CART);
    setPlaced(data.order);
    setNote("");
    void loadOrders();
  }

  async function cancel(order: OrderDTO) {
    setBusy(true);
    const res = await fetch(`/api/merch/orders/${order.id}`, { method: "PATCH" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Couldn't cancel that reservation.");
      return;
    }
    void loadOrders();
  }

  return (
    <Surface corners="none">
      <Column reveal={false}>
        <PageHeader
          eyebrow={["YOUR", "CART"]}
          title="RESERVATION"
          aside={
            <Link
              href="/merchandise"
              className="flex items-center"
              style={{ ...t.label, gap: 8, color: c.muted, textDecoration: "none" }}
            >
              <Icon name="arrow-left" size={13} />
              Keep browsing
            </Link>
          }
        />

        {placed ? (
          <Confirmation order={placed} onDone={() => setPlaced(null)} />
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] items-start"
            style={{ marginTop: `calc(${layout.gap} * 1.5)`, gap: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {/* Lines */}
            <div className="flex flex-col">
              {loading ? (
                <Body small>Loading your cart…</Body>
              ) : cart.lines.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ gap: 14, padding: "clamp(3rem, 10vh, 5rem) 1rem", border: `1px solid ${c.rule}` }}
                >
                  <span style={{ color: c.faint }}>
                    <Icon name="cart" size={26} />
                  </span>
                  <Label color={c.faint}>Your cart is empty</Label>
                  <Body small measure={false}>
                    Reserve something from the drop and it will wait for you here.
                  </Body>
                  <Link
                    href="/merchandise"
                    style={{
                      ...t.label,
                      marginTop: 6,
                      padding: "0.7rem 1.6rem",
                      color: c.accent,
                      border: `1px solid ${c.accent}`,
                      textDecoration: "none",
                    }}
                  >
                    Browse merchandise
                  </Link>
                </div>
              ) : (
                <>
                  <div
                    className="flex items-center justify-between"
                    style={{ paddingBottom: 10, borderBottom: `1px solid ${c.rule}` }}
                  >
                    <Label color={c.faint}>
                      {cart.count} {cart.count === 1 ? "unit" : "units"} held
                    </Label>
                    <button
                      onClick={async () => {
                        setBusy(true);
                        await clearCart();
                        setBusy(false);
                      }}
                      disabled={busy}
                      style={{
                        ...t.label,
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: c.faint,
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  {cart.lines.map((line) => (
                    <CartRow key={line.id} line={line} busy={busy} setBusy={setBusy} />
                  ))}

                  {cart.blocked > 0 && (
                    <div
                      style={{
                        ...t.bodySmall,
                        marginTop: 16,
                        padding: "12px 14px",
                        color: c.text,
                        backgroundColor: c.dangerWash,
                        border: `1px solid ${c.danger}`,
                      }}
                    >
                      {cart.blocked === 1 ? "One item" : `${cart.blocked} items`} in your cart can no
                      longer be reserved. Remove {cart.blocked === 1 ? "it" : "them"} to check out.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary */}
            {cart.lines.length > 0 && (
              <aside
                className="flex flex-col"
                style={{ gap: 16, padding: "clamp(1rem, 2vw, 1.5rem)", border: `1px solid ${c.rule}`, backgroundColor: c.panel }}
              >
                <Label color={c.faint}>Summary</Label>
                <Rule />

                <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
                  <span style={{ ...t.bodySmall, color: c.muted }}>Subtotal</span>
                  <span style={{ ...t.heading, fontSize: "1.5rem", color: c.text }}>
                    {peso(cart.subtotal)}
                  </span>
                </div>

                <Body small measure={false} style={{ color: c.faint }}>
                  Nothing is charged online. Checking out holds your units for {HOLD_DAYS} days —
                  pay any officer on duty and collect at the ACM room, 17F.
                </Body>

                <label className="flex flex-col" style={{ gap: 8 }}>
                  <span style={{ ...t.label, color: c.faint }}>Note for the officer</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={280}
                    placeholder="Optional — pickup day, questions…"
                    style={{
                      ...t.bodySmall,
                      color: c.text,
                      background: "transparent",
                      border: `1px solid ${c.rule}`,
                      borderRadius: 0,
                      padding: "0.6rem 0.7rem",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </label>

                <button
                  onClick={checkout}
                  disabled={busy || cart.blocked > 0 || cart.lines.length === 0}
                  className="flex items-center justify-center"
                  style={{
                    ...t.label,
                    gap: 9,
                    height: 48,
                    color: "#ffffff",
                    backgroundColor: c.accent,
                    border: "none",
                    opacity: busy || cart.blocked > 0 ? 0.5 : 1,
                    cursor: busy || cart.blocked > 0 ? "not-allowed" : "pointer",
                    transition: `opacity ${motion.fast}`,
                  }}
                >
                  <Icon name="check" size={14} />
                  {busy ? "Reserving…" : "Reserve everything"}
                </button>

                {error && (
                  <span role="alert" style={{ ...t.bodySmall, color: c.danger }}>
                    {error}
                  </span>
                )}
              </aside>
            )}
          </div>
        )}

        {/* Past reservations */}
        {orders.length > 0 && (
          <div style={{ marginTop: `calc(${layout.gap} * 2)` }}>
            <Label color={c.faint}>Your reservations</Label>
            <Rule margin="0.6rem 0 0" />
            <div className="flex flex-col" style={{ marginTop: 18, gap: 14 }}>
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} busy={busy} onCancel={() => cancel(o)} />
              ))}
            </div>
          </div>
        )}
      </Column>
    </Surface>
  );
}

/* ── Rows ───────────────────────────────────────────────────── */

function CartRow({
  line,
  busy,
  setBusy,
}: {
  line: CartLineDTO;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const { c } = useDS();
  const ceiling = Math.min(line.variantStock, MAX_PER_VARIANT);

  async function change(quantity: number) {
    setBusy(true);
    await setCartQuantity(line.id, quantity);
    setBusy(false);
  }

  return (
    <div
      className="flex items-center flex-wrap"
      style={{
        gap: 16,
        padding: "16px 0",
        borderBottom: `1px solid ${c.rule}`,
        opacity: line.purchasable ? 1 : 0.6,
      }}
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: 72, height: 78, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}
      >
        {line.itemImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={line.itemImage}
            alt={line.itemName}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: line.purchasable ? undefined : "grayscale(1)" }}
          />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: c.faint }}
          >
            <Icon name="image" size={18} />
          </span>
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1" style={{ gap: 5 }}>
        <Link
          href={`/merchandise/${line.itemSlug}`}
          style={{ ...t.subheading, color: c.text, textDecoration: "none" }}
        >
          {line.itemName}
        </Link>
        <span style={{ ...t.bodySmall, color: c.muted }}>
          {line.variantLabel} · {peso(line.unitPrice)} each
        </span>
        {!line.purchasable && (
          <span style={{ ...t.bodySmall, color: c.danger }}>
            {line.variantStock === 0
              ? "Sold out since you added it."
              : `Only ${line.variantStock} left — lower the quantity.`}
          </span>
        )}
      </div>

      <div className="flex items-center" style={{ gap: 16 }}>
        <div className="flex items-center" style={{ border: `1px solid ${c.rule}` }}>
          <QtyButton
            icon="minus"
            label="Decrease quantity"
            disabled={busy || line.quantity <= 1}
            onClick={() => change(line.quantity - 1)}
          />
          <span
            className="flex items-center justify-center"
            style={{ ...t.mono, width: 38, height: 38, color: c.text }}
          >
            {line.quantity}
          </span>
          <QtyButton
            icon="plus"
            label="Increase quantity"
            disabled={busy || line.quantity >= ceiling}
            onClick={() => change(line.quantity + 1)}
          />
        </div>

        <span style={{ ...t.subheading, color: c.text, minWidth: "5rem", textAlign: "right" }}>
          {peso(line.unitPrice * line.quantity)}
        </span>

        <button
          aria-label={`Remove ${line.itemName}`}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await removeCartLine(line.id);
            setBusy(false);
          }}
          className="flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            background: "none",
            border: "none",
            color: c.faint,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  );
}

function QtyButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: "plus" | "minus";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const { c } = useDS();
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center"
      style={{
        width: 34,
        height: 38,
        background: "none",
        border: "none",
        color: disabled ? c.faint : c.text,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon name={icon} size={13} strokeWidth={2} />
    </button>
  );
}

function OrderRow({
  order,
  busy,
  onCancel,
}: {
  order: OrderDTO;
  busy: boolean;
  onCancel: () => void;
}) {
  const { c } = useDS();

  const tone =
    order.status === "COLLECTED"
      ? c.positive
      : order.status === "CANCELLED"
        ? c.faint
        : c.accent;

  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{ gap: 16, padding: "14px 16px", border: `1px solid ${c.rule}` }}
    >
      <div className="flex flex-col" style={{ gap: 6 }}>
        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          <span style={{ ...t.subheading, color: c.text }}>{order.reference}</span>
          <span style={{ ...t.label, padding: "3px 9px", color: tone, border: `1px solid ${tone}` }}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <span style={{ ...t.bodySmall, color: c.muted }}>
          {order.lines.map((l) => `${l.itemName} · ${l.variantLabel} × ${l.quantity}`).join("  /  ")}
        </span>
        <span style={{ ...t.bodySmall, color: c.faint }}>
          {order.status === "PENDING"
            ? `Hold expires ${new Date(order.expiresAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
            : `Placed ${new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`}
        </span>
      </div>

      <div className="flex items-center" style={{ gap: 16 }}>
        <span style={{ ...t.heading, fontSize: "1.25rem", color: c.text }}>{peso(order.total)}</span>
        {order.status === "PENDING" && (
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              ...t.label,
              padding: "0.55rem 1rem",
              color: c.danger,
              background: "none",
              border: `1px solid ${c.danger}`,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Confirmation({ order, onDone }: { order: OrderDTO; onDone: () => void }) {
  const { c } = useDS();
  return (
    <div
      className="flex flex-col"
      style={{
        marginTop: `calc(${layout.gap} * 1.5)`,
        gap: 18,
        padding: "clamp(1.5rem, 4vw, 2.5rem)",
        border: `1px solid ${c.positive}`,
        backgroundColor: c.positiveWash,
      }}
    >
      <div className="flex items-center" style={{ gap: 10, color: c.positive }}>
        <Icon name="check" size={18} strokeWidth={2.2} />
        <Label color={c.positive}>Reserved</Label>
      </div>

      <span style={{ ...t.title, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: c.text }}>
        {order.reference}
      </span>

      <Body small measure={false}>
        Quote this reference at the ACM room, 17F. Your units are held until{" "}
        {new Date(order.expiresAt).toLocaleDateString("en-PH", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        . Pay any officer on duty — cash or GCash.
      </Body>

      <div style={{ borderTop: `1px solid ${c.rule}`, paddingTop: 14 }}>
        {order.lines.map((l) => (
          <div
            key={l.id}
            className="flex items-baseline justify-between"
            style={{ gap: 12, padding: "6px 0" }}
          >
            <span style={{ ...t.bodySmall, color: c.muted }}>
              {l.itemName} · {l.variantLabel} × {l.quantity}
            </span>
            <span style={{ ...t.mono, color: c.text }}>{peso(l.unitPrice * l.quantity)}</span>
          </div>
        ))}
        <div
          className="flex items-baseline justify-between"
          style={{ gap: 12, paddingTop: 10, marginTop: 6, borderTop: `1px solid ${c.rule}` }}
        >
          <Label color={c.faint}>Total due on collection</Label>
          <span style={{ ...t.heading, fontSize: "1.5rem", color: c.text }}>{peso(order.total)}</span>
        </div>
      </div>

      <div className="flex flex-wrap" style={{ gap: 12 }}>
        <Link
          href="/merchandise"
          style={{
            ...t.label,
            padding: "0.8rem 1.75rem",
            color: "#ffffff",
            backgroundColor: c.accent,
            textDecoration: "none",
          }}
        >
          Back to the store
        </Link>
        <button
          onClick={onDone}
          style={{
            ...t.label,
            padding: "0.8rem 1.75rem",
            color: c.muted,
            background: "none",
            border: `1px solid ${c.rule}`,
            cursor: "pointer",
          }}
        >
          View my reservations
        </button>
      </div>
    </div>
  );
}
