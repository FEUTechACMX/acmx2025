"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Surface, Column, Eyebrow, Title, Rule, Body, Label, useDS } from "@/components/ds";
import { type as t, layout, motion } from "@/styles/design-system";
import Icon from "@/components/admin/icons";
import { MERCH_CATEGORIES, type MerchItemDTO } from "@/types/merch";
import { useCart } from "./cartClient";
import ProductCard from "./ProductCard";

type Filter = "ALL" | (typeof MERCH_CATEGORIES)[number];
type Sort = "FEATURED" | "PRICE_LOW" | "PRICE_HIGH" | "NAME";

const SORTS: { value: Sort; label: string }[] = [
  { value: "FEATURED", label: "Featured" },
  { value: "PRICE_LOW", label: "Price · low to high" },
  { value: "PRICE_HIGH", label: "Price · high to low" },
  { value: "NAME", label: "Name" },
];

const STEPS = [
  {
    no: "01",
    title: "Reserve",
    body: "Pick your item and size online. Reservation holds your unit for 3 days.",
  },
  {
    no: "02",
    title: "Pay",
    body: "Settle with any officer on duty, cash or GCash. Receipt is issued on the spot.",
  },
  {
    no: "03",
    title: "Collect",
    body: "Claim at the ACM room, 17F. Bring your student ID and reference number.",
  },
  {
    no: "04",
    title: "Sold out?",
    body: "Items stay listed when stock runs out. Restocks are announced on the dashboard.",
  },
];

export default function Storefront({ signedIn }: { signedIn: boolean }) {
  const { c } = useDS();
  const [items, setItems] = useState<MerchItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("FEATURED");
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const { cart } = useCart(signedIn);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/merch/items");
        const data = await res.json();
        if (!live) return;
        if (!res.ok) throw new Error(data?.error || "Failed to load merchandise.");
        setItems(data.items ?? []);
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Failed to load merchandise.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const shown = useMemo(() => {
    let list = items;
    if (filter !== "ALL") list = list.filter((i) => i.category === filter);
    if (hideSoldOut) list = list.filter((i) => !i.soldOut);

    const sorted = [...list];
    if (sort === "PRICE_LOW") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "PRICE_HIGH") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "NAME") sorted.sort((a, b) => a.name.localeCompare(b.name));
    // FEATURED keeps the admin's manual ordering, which the API already applied.
    return sorted;
  }, [items, filter, hideSoldOut, sort]);

  // Categories with nothing in them are not offered — an empty chip is a dead end.
  const liveCategories = useMemo(
    () => MERCH_CATEGORIES.filter((cat) => items.some((i) => i.category === cat)),
    [items]
  );

  const available = items.filter((i) => !i.soldOut).length;

  return (
    <Surface corners="bottom-right">
      <Column reveal={false}>
        {/* Masthead */}
        <header>
          <Eyebrow words={["WEAR", "THE", "CHAPTER"]} />
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_25rem] items-end"
            style={{ paddingTop: "0.75rem", gap: "clamp(1.5rem, 4vw, 3.75rem)" }}
          >
            <Title>MERCHANDISE</Title>
            <div className="flex flex-col" style={{ gap: 18 }}>
              <Body small measure={false}>
                Chapter apparel, stickers and accessories — designed by ACM members, produced for
                ACM members. Reserve online, pay and collect on campus.
              </Body>
              <div
                className="flex flex-wrap"
                style={{ gap: 40, paddingTop: 16, borderTop: `1px solid ${c.rule}` }}
              >
                <Stat label="Items" value={String(items.length)} />
                <Stat label="Available" value={String(available)} />
                <Stat label="Pickup" value="ACM Room · 17F" />
              </div>
            </div>
          </div>
          <Rule margin="1.25rem 0 0" />
        </header>

        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between"
          style={{
            gap: 24,
            marginTop: layout.gap,
            paddingBottom: 18,
            borderBottom: `1px solid ${c.rule}`,
          }}
        >
          <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
            <Chip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
              All
            </Chip>
            {liveCategories.map((cat) => (
              <Chip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
                {cat}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap items-center" style={{ gap: 26 }}>
            <Toggle on={hideSoldOut} onClick={() => setHideSoldOut((v) => !v)}>
              Hide sold out
            </Toggle>

            <label className="flex items-center" style={{ gap: 8 }}>
              <span style={{ ...t.label, color: c.faint }}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                style={{
                  ...t.bodySmall,
                  color: c.text,
                  backgroundColor: "transparent",
                  border: `1px solid ${c.rule}`,
                  borderRadius: 0,
                  padding: "8px 13px",
                  cursor: "pointer",
                }}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} style={{ color: "#1a1a1a" }}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {signedIn && (
              <Link
                href="/merchandise/cart"
                className="flex items-center"
                style={{
                  gap: 8,
                  padding: "8px 14px",
                  textDecoration: "none",
                  color: cart.count > 0 ? c.accent : c.muted,
                  border: `1px solid ${cart.count > 0 ? c.accent : c.rule}`,
                  transition: `color ${motion.fast}, border-color ${motion.fast}`,
                }}
              >
                <Icon name="cart" size={14} />
                <span style={{ ...t.label, color: "inherit" }}>
                  Cart{cart.count > 0 ? ` · ${cart.count}` : ""}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Grid */}
        <div style={{ marginTop: `calc(${layout.gap} * 1.5)` }}>
          {loading ? (
            <Body small>Loading the drop…</Body>
          ) : error ? (
            <Body small style={{ color: c.danger }}>
              {error}
            </Body>
          ) : shown.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ gap: 12, padding: "clamp(3rem, 10vh, 6rem) 1rem", border: `1px solid ${c.rule}` }}
            >
              <Label color={c.faint}>Nothing here yet</Label>
              <Body small measure={false}>
                {items.length === 0
                  ? "The store is being stocked. Check back before the next event series."
                  : "No items match that filter."}
              </Body>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gap: "clamp(1.75rem, 3vw, 2.75rem)",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 15rem), 1fr))",
              }}
            >
              {shown.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{
            marginTop: `calc(${layout.gap} * 2)`,
            paddingTop: 30,
            borderTop: `1px solid ${c.rule}`,
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.no}
              className="flex flex-col"
              style={{
                gap: 10,
                padding: "0 28px",
                paddingLeft: i === 0 ? 0 : 28,
                borderLeft: i === 0 ? "none" : `1px solid ${c.rule}`,
              }}
            >
              <span style={{ ...t.label, color: c.accent }}>{step.no}</span>
              <span style={{ ...t.label, fontSize: "0.8125rem", letterSpacing: "0.12em", color: c.text }}>
                {step.title}
              </span>
              <Body small measure={false}>
                {step.body}
              </Body>
            </div>
          ))}
        </div>
      </Column>
    </Surface>
  );
}

/* ── Toolbar bits ───────────────────────────────────────────── */

function Stat({ label, value }: { label: string; value: string }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 5 }}>
      <span style={{ ...t.label, color: c.faint }}>{label}</span>
      <span style={{ ...t.mono, color: c.text }}>{value}</span>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      style={{
        ...t.label,
        padding: "8px 14px",
        cursor: "pointer",
        borderRadius: 0,
        color: active ? "#ffffff" : c.muted,
        backgroundColor: active ? c.accent : "transparent",
        border: `1px solid ${active ? c.accent : c.rule}`,
        transition: `background-color ${motion.fast}, color ${motion.fast}`,
      }}
    >
      {children}
    </button>
  );
}

/** Hairline square that fills with the accent — the system has no pill switches. */
function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="flex items-center"
      style={{ gap: 11, background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <span
        aria-hidden="true"
        className="flex items-center justify-center"
        style={{
          width: 16,
          height: 16,
          border: `1px solid ${on ? c.accent : c.ruleStrong}`,
          backgroundColor: on ? c.accent : "transparent",
          color: "#ffffff",
          transition: `background-color ${motion.fast}, border-color ${motion.fast}`,
        }}
      >
        {on && <Icon name="check" size={11} strokeWidth={2.4} />}
      </span>
      <span style={{ ...t.label, color: on ? c.text : c.muted }}>{children}</span>
    </button>
  );
}
