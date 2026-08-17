"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Surface, Column, Body, DataRow, Label, Rule, useDS } from "@/components/ds";
import { type as t, layout, motion } from "@/styles/design-system";
import Icon from "@/components/admin/icons";
import {
  MAX_PER_VARIANT,
  peso,
  type MerchItemDTO,
  type MerchVariantDTO,
} from "@/types/merch";
import { addToCart } from "./cartClient";
import ProductCard from "./ProductCard";

type Feedback = { tone: "positive" | "danger" | "muted"; text: string } | null;

export default function ItemDetail({
  item,
  more,
  signedIn,
}: {
  item: MerchItemDTO;
  more: MerchItemDTO[];
  signedIn: boolean;
}) {
  const { c } = useDS();
  const router = useRouter();

  const firstAvailable = item.variants.find((v) => v.available) ?? null;
  const [variant, setVariant] = useState<MerchVariantDTO | null>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [notified, setNotified] = useState(false);

  // The ceiling is whichever runs out first: the shelf, or the per-member cap.
  const ceiling = variant ? Math.min(variant.stock, MAX_PER_VARIANT) : 1;
  const canReserve = signedIn && !item.soldOut && !!variant && variant.available;

  const soldOutNote = useMemo(() => {
    if (!item.soldOut) {
      const gone = item.variants.filter((v) => !v.available).map((v) => v.label);
      if (gone.length === 0) return null;
      return `${gone.join(", ")} ${gone.length === 1 ? "is" : "are"} sold out — join the restock list below.`;
    }
    return "Every size is out of stock right now.";
  }, [item]);

  async function reserve(thenCart: boolean) {
    if (!variant) return;
    setBusy(true);
    setFeedback(null);

    const res = await addToCart(variant.id, qty);
    setBusy(false);

    if (!res.ok) {
      setFeedback({ tone: "danger", text: res.error });
      return;
    }
    if (thenCart) {
      router.push("/merchandise/cart");
      return;
    }
    setFeedback({
      tone: "positive",
      text: res.capped
        ? `Cart updated — capped at ${ceiling} for this size.`
        : `Added to your cart. ${variant.label} × ${qty}.`,
    });
  }

  async function notifyMe() {
    setBusy(true);
    const res = await fetch("/api/merch/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setFeedback({ tone: "danger", text: data?.error || "Couldn't join the restock list." });
      return;
    }
    setNotified(true);
    setFeedback({ tone: "positive", text: "You're on the list. Restocks are posted on the dashboard." });
  }

  const cover = item.images[image] ?? item.images[0] ?? null;

  return (
    <Surface corners="none">
      <Column reveal={false}>
        <Link
          href="/merchandise"
          className="flex items-center"
          style={{ ...t.label, gap: 8, color: c.faint, textDecoration: "none", width: "fit-content" }}
        >
          <Icon name="arrow-left" size={13} />
          Back to merchandise
        </Link>

        <div
          className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]"
          style={{ marginTop: layout.gap, gap: "clamp(2rem, 5vw, 4.25rem)" }}
        >
          {/* Gallery */}
          <div className="flex flex-col" style={{ gap: 14 }}>
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "1 / 0.9",
                backgroundColor: c.panel,
                border: `1px solid ${c.rule}`,
              }}
            >
              {cover ? (
                <Image
                  src={cover}
                  alt={item.name}
                  fill
                  // The hero on this page — worth fetching eagerly rather than
                  // lazily, since it is the reason the page was opened.
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  style={{ filter: item.soldOut ? "grayscale(1)" : undefined }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ gap: 14, color: c.faint }}
                >
                  <Icon name="image" size={36} />
                  <span style={{ ...t.label, color: c.faint }}>Product photo</span>
                </div>
              )}
            </div>

            {item.images.length > 1 && (
              <div className="grid" style={{ gap: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
                {item.images.slice(0, 8).map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setImage(i)}
                    className="relative overflow-hidden"
                    style={{
                      aspectRatio: "1 / 0.85",
                      padding: 0,
                      cursor: "pointer",
                      backgroundColor: c.panel,
                      border: `1px solid ${i === image ? c.accent : c.rule}`,
                      transition: `border-color ${motion.fast}`,
                    }}
                  >
                    <Image
                      src={src}
                      alt={`${item.name} view ${i + 1}`}
                      fill
                      // Four-across thumbnail strip.
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="flex flex-col" style={{ gap: 26 }}>
            <div className="flex flex-col" style={{ gap: 16 }}>
              <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
                <span
                  style={{
                    ...t.label,
                    padding: "5px 11px",
                    color: c.muted,
                    border: `1px solid ${c.rule}`,
                  }}
                >
                  {item.category}
                </span>
                {item.soldOut ? (
                  <span
                    style={{
                      ...t.label,
                      padding: "5px 11px",
                      color: c.muted,
                      backgroundColor: c.panel,
                      border: `1px solid ${c.ruleStrong}`,
                    }}
                  >
                    Sold out
                  </span>
                ) : (
                  item.isNewDrop && (
                    <span
                      style={{
                        ...t.label,
                        padding: "5px 11px",
                        color: "#ffffff",
                        backgroundColor: c.accent,
                      }}
                    >
                      New drop
                    </span>
                  )
                )}
              </div>

              <h1
                style={{
                  ...t.title,
                  fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)",
                  color: c.text,
                  margin: 0,
                }}
              >
                {item.name}
              </h1>

              <div
                className="flex items-end flex-wrap"
                style={{ gap: 14, paddingBottom: 20, borderBottom: `1px solid ${c.rule}` }}
              >
                <span style={{ ...t.heading, color: c.text }}>{peso(item.price)}</span>
                <span style={{ ...t.bodySmall, color: c.faint }}>inclusive · members only</span>
              </div>
            </div>

            {(item.description || item.blurb) && (
              <Body small measure={false}>
                {item.description || item.blurb}
              </Body>
            )}

            {/* Sizes */}
            {item.variants.length > 0 && (
              <div className="flex flex-col" style={{ gap: 12 }}>
                <Label color={c.faint}>
                  {item.variants.length === 1 ? "Variant" : "Size"}
                </Label>
                <div className="flex flex-wrap" style={{ gap: 10 }}>
                  {item.variants.map((v) => {
                    const selected = variant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        disabled={!v.available}
                        onClick={() => {
                          setVariant(v);
                          setQty(1);
                          setFeedback(null);
                        }}
                        style={{
                          ...t.label,
                          fontSize: "0.8125rem",
                          minWidth: 52,
                          height: 46,
                          padding: "0 14px",
                          cursor: v.available ? "pointer" : "not-allowed",
                          color: !v.available ? c.faint : selected ? "#ffffff" : c.text,
                          backgroundColor: selected && v.available ? c.accent : "transparent",
                          border: `1px solid ${selected && v.available ? c.accent : c.rule}`,
                          textDecoration: v.available ? "none" : "line-through",
                          opacity: v.available ? 1 : 0.5,
                          transition: `background-color ${motion.fast}, color ${motion.fast}`,
                        }}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
                {soldOutNote && (
                  <span style={{ ...t.bodySmall, color: c.faint }}>{soldOutNote}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col" style={{ gap: 12 }}>
              <div className="flex flex-wrap items-stretch" style={{ gap: 12 }}>
                <div
                  className="flex items-center shrink-0"
                  style={{
                    border: `1px solid ${c.ruleStrong}`,
                    opacity: canReserve ? 1 : 0.45,
                  }}
                >
                  <StepButton
                    icon="minus"
                    label="Decrease quantity"
                    disabled={!canReserve || qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  />
                  <span
                    className="flex items-center justify-center"
                    style={{
                      ...t.mono,
                      width: 44,
                      height: 46,
                      color: c.text,
                      borderLeft: `1px solid ${c.rule}`,
                      borderRight: `1px solid ${c.rule}`,
                    }}
                  >
                    {qty}
                  </span>
                  <StepButton
                    icon="plus"
                    label="Increase quantity"
                    disabled={!canReserve || qty >= ceiling}
                    onClick={() => setQty((q) => Math.min(ceiling, q + 1))}
                  />
                </div>

                <button
                  disabled={!canReserve || busy}
                  onClick={() => reserve(false)}
                  className="flex items-center justify-center flex-1"
                  style={{
                    ...t.label,
                    gap: 9,
                    minWidth: 180,
                    height: 46,
                    padding: "0 1.5rem",
                    cursor: canReserve && !busy ? "pointer" : "not-allowed",
                    color: canReserve ? "#ffffff" : c.muted,
                    backgroundColor: canReserve ? c.accent : c.panel,
                    border: canReserve ? "none" : `1px solid ${c.ruleStrong}`,
                    opacity: busy ? 0.6 : 1,
                    transition: `background-color ${motion.fast}`,
                  }}
                >
                  <Icon name="cart" size={14} />
                  {item.soldOut ? "Sold out" : busy ? "Adding…" : "Add to cart"}
                </button>
              </div>

              {canReserve && (
                <button
                  disabled={busy}
                  onClick={() => reserve(true)}
                  className="flex items-center justify-center"
                  style={{
                    ...t.label,
                    height: 46,
                    width: "100%",
                    cursor: busy ? "not-allowed" : "pointer",
                    color: c.accent,
                    backgroundColor: "transparent",
                    border: `1px solid ${c.accent}`,
                  }}
                >
                  Reserve now
                </button>
              )}

              {item.soldOut && signedIn && (
                <button
                  disabled={busy || notified}
                  onClick={notifyMe}
                  className="flex items-center justify-center"
                  style={{
                    ...t.label,
                    gap: 9,
                    height: 46,
                    width: "100%",
                    cursor: notified ? "default" : "pointer",
                    color: notified ? c.positive : c.accent,
                    backgroundColor: "transparent",
                    border: `1px solid ${notified ? c.positive : c.accent}`,
                  }}
                >
                  <Icon name={notified ? "check" : "bell"} size={14} />
                  {notified ? "On the restock list" : "Notify me when restocked"}
                </button>
              )}

              {!signedIn && (
                <span style={{ ...t.bodySmall, color: c.faint }}>
                  Merchandise is for ACM members — sign in to reserve.
                </span>
              )}

              {feedback && (
                <span
                  role="status"
                  style={{
                    ...t.bodySmall,
                    color:
                      feedback.tone === "danger"
                        ? c.danger
                        : feedback.tone === "positive"
                          ? c.positive
                          : c.faint,
                  }}
                >
                  {feedback.text}
                </span>
              )}

              <Body small measure={false} style={{ color: c.faint }}>
                {item.soldOut
                  ? "The item is never removed from the store — it stays listed, greyed, and un-reservable."
                  : "Reservation holds your unit for 3 days. Pay and collect at the ACM room, 17F."}
              </Body>
            </div>

            {/* Facts */}
            <div style={{ paddingTop: 6 }}>
              <DataRow label="Pickup" value={item.pickupNote || "ACM Room · 17F"} />
              <DataRow label="Payment" value={item.paymentNote || "Cash or GCash"} />
              <DataRow label="Restock" value={item.restockNote || "Announced on dashboard"} />
              <DataRow label="Enquiries" value="acm.feu.it@gmail.com" />
            </div>
          </div>
        </div>

        {/* Also in the drop */}
        {more.length > 0 && (
          <div style={{ marginTop: `calc(${layout.gap} * 2)` }}>
            <Label color={c.faint}>Also in the drop</Label>
            <Rule margin="0.6rem 0 0" />
            <div
              className="grid"
              style={{
                marginTop: 26,
                gap: "clamp(1.75rem, 3vw, 2.75rem)",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 15rem), 1fr))",
              }}
            >
              {more.map((m) => (
                <ProductCard key={m.id} item={m} />
              ))}
            </div>
          </div>
        )}
      </Column>
    </Surface>
  );
}

function StepButton({
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
        width: 44,
        height: 46,
        background: "none",
        border: "none",
        color: disabled ? c.faint : c.text,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon name={icon} size={14} strokeWidth={2} />
    </button>
  );
}
