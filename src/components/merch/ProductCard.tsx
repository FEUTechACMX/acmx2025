"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "@/components/ds";
import Icon from "@/components/admin/icons";
import { peso, stockNote, type MerchItemDTO } from "@/types/merch";

/**
 * Storefront card. Sold out is a *neutral* treatment — a grey scrim and a
 * hairline band across the image, never `danger`: running out isn't an error,
 * and the item deliberately stays listed and readable.
 */
export default function ProductCard({ item }: { item: MerchItemDTO }) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);

  const cover = item.images[0] ?? null;
  const note = stockNote(item);
  const noteColor = note.tone === "accent" ? c.accent : note.tone === "faint" ? c.faint : c.muted;

  return (
    <Link
      href={`/merchandise/${item.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col"
      style={{ gap: 14, textDecoration: "none" }}
    >
      {/* Image zone */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "1 / 1.03",
          backgroundColor: c.panel,
          border: `1px solid ${hover && !item.soldOut ? c.accent : c.rule}`,
          transition: `border-color ${motion.fast}`,
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: item.soldOut ? "grayscale(1)" : undefined,
              transform: hover && !item.soldOut ? "scale(1.03)" : "scale(1)",
              transition: `transform ${motion.base} ${motion.ease}`,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ gap: 12, color: c.faint }}
          >
            <Icon name="image" size={28} />
            <span style={{ ...t.label, color: c.faint }}>Product photo</span>
          </div>
        )}

        {item.isNewDrop && !item.soldOut && (
          <span
            style={{
              ...t.label,
              position: "absolute",
              top: 0,
              left: 0,
              padding: "4px 9px",
              backgroundColor: c.accent,
              color: "#ffffff",
            }}
          >
            New drop
          </span>
        )}

        {item.soldOut && (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ backgroundColor: "#1a1a1a", opacity: 0.66 }}
            />
            <div
              className="absolute left-0 w-full flex items-center justify-center"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                height: 42,
                backgroundColor: c.surface,
                borderTop: `1px solid ${c.ruleStrong}`,
                borderBottom: `1px solid ${c.ruleStrong}`,
              }}
            >
              <span style={{ ...t.label, letterSpacing: "0.38em", color: c.text }}>Sold out</span>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col" style={{ gap: 9 }}>
        <span style={{ ...t.label, color: c.faint }}>{item.category}</span>
        <span
          style={{
            ...t.subheading,
            color: item.soldOut ? c.muted : c.text,
            transition: `color ${motion.fast}`,
          }}
        >
          {item.name}
        </span>
        <div
          className="flex items-end justify-between"
          style={{ gap: 12, paddingTop: 9, borderTop: `1px solid ${c.rule}` }}
        >
          <span style={{ ...t.subheading, color: item.soldOut ? c.muted : c.text }}>
            {peso(item.price)}
          </span>
          <span
            style={{
              ...(note.tone === "accent" ? t.label : t.bodySmall),
              color: noteColor,
              textAlign: "right",
            }}
          >
            {note.text}
          </span>
        </div>
      </div>
    </Link>
  );
}
