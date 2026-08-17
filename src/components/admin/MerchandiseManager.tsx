"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import AdminShell, {
  AdminContent,
  AdminPageHeader,
  AdminButton,
  SectionLabel,
} from "./AdminShell";
import Icon from "./icons";
import {
  MERCH_CATEGORIES,
  MERCH_STATUSES,
  ORDER_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_NOTES,
  peso,
  type MerchCategory,
  type MerchItemDTO,
  type MerchStatus,
  type OrderDTO,
} from "@/types/merch";

type AdminItem = MerchItemDTO & { restockRequests?: number };
type StatusFilter = "ALL" | MerchStatus;

/** The editor's working copy — variants are plain rows until saved. */
type Draft = {
  id: string | null;
  name: string;
  category: MerchCategory;
  price: string;
  blurb: string;
  description: string;
  images: string[];
  status: MerchStatus;
  isNewDrop: boolean;
  pickupNote: string;
  paymentNote: string;
  restockNote: string;
  variants: { label: string; stock: string; soldOut: boolean }[];
};

const BLANK: Draft = {
  id: null,
  name: "",
  category: "APPAREL",
  price: "",
  blurb: "",
  description: "",
  images: [],
  status: "AVAILABLE",
  isNewDrop: false,
  pickupNote: "",
  paymentNote: "",
  restockNote: "",
  variants: [{ label: "ONE SIZE", stock: "0", soldOut: false }],
};

function toDraft(item: AdminItem): Draft {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: String(item.price),
    blurb: item.blurb ?? "",
    description: item.description ?? "",
    images: [...item.images],
    status: item.status,
    isNewDrop: item.isNewDrop,
    pickupNote: item.pickupNote ?? "",
    paymentNote: item.paymentNote ?? "",
    restockNote: item.restockNote ?? "",
    variants: item.variants.map((v) => ({
      label: v.label,
      stock: String(v.stock),
      soldOut: v.soldOut,
    })),
  };
}

export default function MerchandiseManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [items, setItems] = useState<AdminItem[]>([]);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "positive"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [itemsRes, ordersRes] = await Promise.all([
      fetch("/api/admin/merch/items"),
      fetch("/api/admin/merch/orders"),
    ]);
    const itemsData = await itemsRes.json().catch(() => ({}));
    const ordersData = await ordersRes.json().catch(() => ({}));

    if (itemsRes.ok) setItems(itemsData.items ?? []);
    if (ordersRes.ok) setOrders(ordersData.orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const shown = useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      available: items.filter((i) => i.status === "AVAILABLE" && !i.soldOut).length,
      soldOut: items.filter((i) => i.status !== "HIDDEN" && i.soldOut).length,
      hidden: items.filter((i) => i.status === "HIDDEN").length,
    }),
    [items]
  );

  const openOrders = orders.filter((o) => o.status === "PENDING" || o.status === "READY");
  const expiringToday = orders.filter(
    (o) => o.status === "PENDING" && new Date(o.expiresAt).toDateString() === new Date().toDateString()
  ).length;

  async function save(d: Draft) {
    setBusy(true);
    setMessage(null);

    const payload = {
      name: d.name,
      category: d.category,
      price: Number(d.price || 0),
      blurb: d.blurb,
      description: d.description,
      images: d.images,
      status: d.status,
      isNewDrop: d.isNewDrop,
      pickupNote: d.pickupNote,
      paymentNote: d.paymentNote,
      restockNote: d.restockNote,
      variants: d.variants.map((v) => ({
        label: v.label,
        stock: Number(v.stock || 0),
        soldOut: v.soldOut,
      })),
    };

    const res = await fetch(
      d.id ? `/api/admin/merch/items/${d.id}` : "/api/admin/merch/items",
      {
        method: d.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't save the item." });
      return;
    }
    setMessage({ tone: "positive", text: d.id ? "Item saved." : "Item created." });
    setDraft(null);
    void load();
  }

  async function remove(d: Draft) {
    if (!d.id) return;
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return;

    setBusy(true);
    const res = await fetch(`/api/admin/merch/items/${d.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't delete the item." });
      return;
    }
    setMessage({ tone: "positive", text: "Item deleted." });
    setDraft(null);
    void load();
  }

  async function moveOrder(order: OrderDTO, status: OrderDTO["status"]) {
    setBusy(true);
    const res = await fetch(`/api/admin/merch/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't update the reservation." });
      return;
    }
    void load();
  }

  function exportOrders() {
    // Plain CSV — officers reconcile these against cash on hand in a spreadsheet.
    const rows = [
      ["Reference", "Status", "Member", "Student no.", "Item", "Variant", "Qty", "Unit", "Placed"],
      ...orders.flatMap((o) =>
        o.lines.map((l) => [
          o.reference,
          o.status,
          o.member?.name ?? "",
          o.member?.studentId ?? "",
          l.itemName,
          l.variantLabel,
          String(l.quantity),
          String(l.unitPrice),
          new Date(o.createdAt).toISOString().slice(0, 10),
        ])
      ),
    ];
    const csv = rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `acm-merch-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell user={user} breadcrumb="Merchandise" searchPlaceholder="Search items…">
      <AdminContent>
      <AdminPageHeader
        eyebrow="STORE"
        title="Merchandise"
        subtitle={
          loading
            ? "Loading the catalogue…"
            : `${counts.total} items · ${counts.available} available · ${counts.soldOut} sold out · ${counts.hidden} hidden from the store`
        }
        actions={
          <>
            <AdminButton variant="ghost" icon="download" onClick={exportOrders}>
              Export orders
            </AdminButton>
            <AdminButton icon="plus" onClick={() => setDraft({ ...BLANK })}>
              New item
            </AdminButton>
          </>
        }
      />

      {message && (
        <div
          role="status"
          style={{
            ...t.bodySmall,
            padding: "10px 14px",
            color: c.text,
            backgroundColor: message.tone === "danger" ? c.dangerWash : c.positiveWash,
            border: `1px solid ${message.tone === "danger" ? c.danger : c.positive}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        className="grid grid-cols-1 xl:grid-cols-[1fr_470px] items-start"
        style={{ gap: 24 }}
      >
        {/* Left: catalogue + reservations */}
        <div className="flex flex-col" style={{ gap: 14, minWidth: 0 }}>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {(["ALL", ...MERCH_STATUSES] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...t.label,
                  fontSize: 10,
                  padding: "7px 12px",
                  cursor: "pointer",
                  color: filter === f ? c.text : c.muted,
                  backgroundColor: filter === f ? c.accentWash : "transparent",
                  border: `1px solid ${filter === f ? c.accent : c.rule}`,
                  transition: `border-color ${motion.fast}`,
                }}
              >
                {f === "ALL" ? "All" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          <ItemsTable
            items={shown}
            loading={loading}
            selectedId={draft?.id ?? null}
            onSelect={(item) => setDraft(toDraft(item))}
          />

          <div className="flex flex-col" style={{ gap: 12, paddingTop: 14 }}>
            <div
              className="flex items-end justify-between flex-wrap"
              style={{ gap: 12, paddingBottom: 9, borderBottom: `1px solid ${c.rule}` }}
            >
              <span style={{ ...t.label, color: c.faint }}>Reservations — awaiting pickup</span>
              <span style={{ ...t.bodySmall, color: c.muted }}>
                {openOrders.length} open · {expiringToday} expiring today
              </span>
            </div>
            <ReservationsTable orders={orders} busy={busy} onMove={moveOrder} />
          </div>
        </div>

        {/* Right: editor */}
        {draft ? (
          <ItemEditor
            key={draft.id ?? "new"}
            draft={draft}
            busy={busy}
            onChange={setDraft}
            onClose={() => setDraft(null)}
            onSave={save}
            onDelete={remove}
          />
        ) : (
          <div
            className="hidden xl:flex flex-col items-center justify-center text-center"
            style={{
              gap: 12,
              padding: 40,
              minHeight: 320,
              backgroundColor: c.panel,
              border: `1px solid ${c.rule}`,
            }}
          >
            <span style={{ color: c.faint }}>
              <Icon name="package" size={26} />
            </span>
            <span style={{ ...t.label, color: c.faint }}>No item selected</span>
            <span style={{ ...t.bodySmall, color: c.muted, maxWidth: 260 }}>
              Pick a row to edit it, or start a new item.
            </span>
          </div>
        )}
      </div>
      </AdminContent>
    </AdminShell>
  );
}

/* ── Items table ────────────────────────────────────────────── */

function StatusPill({ item }: { item: AdminItem }) {
  const { c } = useDS();

  // Sold out is grey, not red: an empty shelf is a fact, not a fault.
  const skin =
    item.status === "HIDDEN"
      ? { color: c.faint, bg: "transparent", border: c.rule, text: "Hidden" }
      : item.soldOut
        ? { color: c.muted, bg: c.panel, border: c.ruleStrong, text: "Sold out" }
        : { color: c.positive, bg: c.positiveWash, border: c.positive, text: "Available" };

  return (
    <span
      style={{
        ...t.label,
        fontSize: 10,
        padding: "4px 9px",
        color: skin.color,
        backgroundColor: skin.bg,
        border: `1px solid ${skin.border}`,
      }}
    >
      {skin.text}
    </span>
  );
}

function ItemsTable({
  items,
  loading,
  selectedId,
  onSelect,
}: {
  items: AdminItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (item: AdminItem) => void;
}) {
  const { c } = useDS();

  const head = { ...t.label, fontSize: 10, color: c.faint } as React.CSSProperties;
  const cell = { ...t.bodySmall, color: c.text } as React.CSSProperties;

  return (
    <div style={{ border: `1px solid ${c.rule}`, overflowX: "auto" }}>
      <div style={{ minWidth: 620 }}>
        <div
          className="flex items-center"
          style={{ padding: "0 14px", backgroundColor: c.panel, borderBottom: `1px solid ${c.rule}` }}
        >
          <span style={{ ...head, flex: 1, padding: "11px 0" }}>Item</span>
          <span style={{ ...head, width: 104 }}>Category</span>
          <span style={{ ...head, width: 74 }}>Price</span>
          <span style={{ ...head, width: 62 }}>Stock</span>
          <span style={{ ...head, width: 108 }}>Status</span>
        </div>

        {loading ? (
          <div style={{ ...cell, color: c.muted, padding: "18px 14px" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ ...cell, color: c.muted, padding: "18px 14px" }}>
            Nothing here. Create an item to stock the store.
          </div>
        ) : (
          items.map((item, i) => {
            const selected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="flex items-center w-full text-left"
                style={{
                  padding: "0 14px",
                  cursor: "pointer",
                  backgroundColor: selected ? c.accentWash : "transparent",
                  borderBottom: i === items.length - 1 ? "none" : `1px solid ${c.rule}`,
                  borderLeft: `2px solid ${selected ? c.accent : "transparent"}`,
                  transition: `background-color ${motion.fast}`,
                }}
              >
                <span className="flex items-center flex-1 min-w-0" style={{ gap: 10, padding: "12px 0" }}>
                  <span
                    className="flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      width: 26,
                      height: 26,
                      color: c.faint,
                      backgroundColor: c.panel,
                      border: `1px solid ${c.rule}`,
                    }}
                  >
                    {item.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="image" size={12} />
                    )}
                  </span>
                  <span
                    style={{
                      ...cell,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </span>
                  {item.restockRequests ? (
                    <span style={{ ...t.label, fontSize: 9, color: c.accent }}>
                      {item.restockRequests} waiting
                    </span>
                  ) : null}
                </span>
                <span style={{ ...cell, color: c.muted, width: 104 }}>{item.category}</span>
                <span style={{ ...t.mono, color: c.text, width: 74 }}>{peso(item.price)}</span>
                <span style={{ ...t.mono, color: item.stock > 0 ? c.text : c.muted, width: 62 }}>
                  {item.stock}
                </span>
                <span style={{ width: 108 }}>
                  <StatusPill item={item} />
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Reservations ───────────────────────────────────────────── */

function ReservationsTable({
  orders,
  busy,
  onMove,
}: {
  orders: OrderDTO[];
  busy: boolean;
  onMove: (order: OrderDTO, status: OrderDTO["status"]) => void;
}) {
  const { c } = useDS();
  const [showAll, setShowAll] = useState(false);

  const open = orders.filter((o) => o.status === "PENDING" || o.status === "READY");
  const list = showAll ? orders : open;

  const head = { ...t.label, fontSize: 10, color: c.faint } as React.CSSProperties;

  if (orders.length === 0) {
    return (
      <span style={{ ...t.bodySmall, color: c.muted, padding: "10px 0" }}>
        No reservations yet.
      </span>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 620 }}>
          <div
            className="flex items-center"
            style={{ paddingBottom: 8, borderBottom: `1px solid ${c.rule}` }}
          >
            <span style={{ ...head, flex: 1 }}>Member</span>
            <span style={{ ...head, width: 190 }}>Item</span>
            <span style={{ ...head, width: 50 }}>Qty</span>
            <span style={{ ...head, width: 96 }}>Ref</span>
            <span style={{ ...head, width: 190 }} />
          </div>

          {list.length === 0 ? (
            <span style={{ ...t.bodySmall, color: c.muted, display: "block", padding: "12px 0" }}>
              Nothing awaiting pickup.
            </span>
          ) : (
            list.map((o, i) => (
              <div
                key={o.id}
                className="flex items-center"
                style={{
                  padding: "11px 0",
                  borderBottom: i === list.length - 1 ? "none" : `1px solid ${c.rule}`,
                }}
              >
                <span className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                  <span style={{ ...t.bodySmall, color: c.text }}>{o.member?.name ?? "—"}</span>
                  <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
                    {o.member?.studentId ?? ""}
                  </span>
                </span>
                <span style={{ ...t.bodySmall, color: c.muted, width: 190, paddingRight: 8 }}>
                  {o.lines.map((l) => `${l.itemName} · ${l.variantLabel}`).join(", ")}
                </span>
                <span style={{ ...t.mono, color: c.text, width: 50 }}>
                  {o.lines.reduce((n, l) => n + l.quantity, 0)}
                </span>
                <span style={{ ...t.mono, color: c.muted, width: 96 }}>{o.reference}</span>
                <span className="flex items-center" style={{ gap: 6, width: 190 }}>
                  {o.status === "PENDING" && (
                    <MiniButton disabled={busy} onClick={() => onMove(o, "READY")}>
                      Ready
                    </MiniButton>
                  )}
                  {(o.status === "PENDING" || o.status === "READY") && (
                    <>
                      <MiniButton disabled={busy} onClick={() => onMove(o, "COLLECTED")}>
                        Collected
                      </MiniButton>
                      <MiniButton
                        disabled={busy}
                        tone="danger"
                        onClick={() => onMove(o, "CANCELLED")}
                      >
                        Cancel
                      </MiniButton>
                    </>
                  )}
                  {(o.status === "COLLECTED" || o.status === "CANCELLED") && (
                    <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAll((v) => !v)}
        style={{
          ...t.label,
          fontSize: 10,
          alignSelf: "flex-start",
          background: "none",
          border: "none",
          padding: 0,
          color: c.muted,
          cursor: "pointer",
        }}
      >
        {showAll ? "Show open only" : `Show all ${orders.length}`}
      </button>
    </div>
  );
}

function MiniButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  const { c } = useDS();
  const edge = tone === "danger" ? c.danger : c.rule;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...t.label,
        fontSize: 9,
        padding: "6px 9px",
        color: tone === "danger" ? c.danger : c.muted,
        background: "none",
        border: `1px solid ${edge}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ── Editor ─────────────────────────────────────────────────── */

function ItemEditor({
  draft,
  busy,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft;
  busy: boolean;
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onDelete: (d: Draft) => void;
}) {
  const { c } = useDS();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    onChange({ ...draft, [key]: value });

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const form = new FormData();
    form.append("bucket", "merch");
    Array.from(files).forEach((f) => form.append("files", f));

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok) {
      setUploadError(data?.error || "Upload failed. You can paste an image URL instead.");
      return;
    }
    onChange({ ...draft, images: [...draft.images, ...(data.urls ?? [])] });
  }

  return (
    <aside
      className="flex flex-col"
      style={{ gap: 20, padding: 22, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}
    >
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: 14, borderBottom: `1px solid ${c.rule}` }}
      >
        <span style={{ ...t.label, color: c.text }}>
          {draft.id ? "Item editor" : "New item"}
        </span>
        <button
          aria-label="Close editor"
          onClick={onClose}
          style={{ background: "none", border: "none", color: c.muted, cursor: "pointer", padding: 0 }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Photos */}
      <div className="flex" style={{ gap: 14 }}>
        <div
          className="flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            width: 120,
            height: 110,
            color: c.faint,
            backgroundColor: c.surface,
            border: `1px solid ${c.rule}`,
          }}
        >
          {draft.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="image" size={22} />
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 9 }}>
          <span style={{ ...t.label, fontSize: 10, color: c.faint }}>Product photos</span>
          <span style={{ ...t.bodySmall, color: c.muted }}>
            {draft.images.length === 0
              ? "No photos yet"
              : `${draft.images.length} ${draft.images.length === 1 ? "photo" : "photos"} · first one is the store thumbnail`}
          </span>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => upload(e.target.files)}
          />

          <div className="flex flex-wrap" style={{ gap: 7 }}>
            <EditorChip icon="upload" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Upload"}
            </EditorChip>
            <EditorChip
              icon="image-plus"
              onClick={() => {
                const url = window.prompt("Image URL");
                if (url?.trim()) set("images", [...draft.images, url.trim()]);
              }}
            >
              Add URL
            </EditorChip>
            {draft.images.length > 0 && (
              <EditorChip
                icon="trash"
                tone="danger"
                onClick={() => set("images", draft.images.slice(0, -1))}
              >
                Remove last
              </EditorChip>
            )}
          </div>

          {uploadError && (
            <span style={{ ...t.bodySmall, color: c.danger }}>{uploadError}</span>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col" style={{ gap: 16 }}>
        <EditorField
          label="Item name"
          value={draft.name}
          onChange={(v) => set("name", v)}
          placeholder="Chapter Tee — Black"
        />

        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <div className="flex flex-col" style={{ gap: 9 }}>
            <span style={{ ...t.label, fontSize: 10, color: c.faint }}>Category</span>
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value as MerchCategory)}
              style={inputStyle(c)}
            >
              {MERCH_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} style={{ color: "#1a1a1a" }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <EditorField
            label="Price (₱)"
            value={draft.price}
            onChange={(v) => set("price", v.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="450"
          />
        </div>

        <EditorField
          label="Description"
          value={draft.description}
          onChange={(v) => set("description", v)}
          multiline
          placeholder="Heavyweight cotton tee, screen-printed with the diamond mark…"
        />

        <label className="flex items-center" style={{ gap: 10, cursor: "pointer" }}>
          <Check on={draft.isNewDrop} onClick={() => set("isNewDrop", !draft.isNewDrop)} />
          <span style={{ ...t.bodySmall, color: c.text }}>Flag as a new drop</span>
        </label>
      </div>

      {/* Variants */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>Variants &amp; stock</SectionLabel>

        <div className="flex items-center" style={{ paddingBottom: 9, borderBottom: `1px solid ${c.rule}` }}>
          <span style={{ ...t.label, fontSize: 10, color: c.faint, flex: 1 }}>Size</span>
          <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 84 }}>Stock</span>
          <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 84 }}>Sold out</span>
          <span style={{ width: 30 }} />
        </div>

        {draft.variants.map((v, i) => (
          <div key={i} className="flex items-center" style={{ paddingBottom: 10, borderBottom: `1px solid ${c.rule}` }}>
            <input
              value={v.label}
              onChange={(e) => {
                const next = [...draft.variants];
                next[i] = { ...v, label: e.target.value.toUpperCase() };
                set("variants", next);
              }}
              placeholder="M"
              style={{ ...inputStyle(c), flex: 1, marginRight: 8, padding: "6px 9px" }}
            />
            <div style={{ width: 84 }}>
              <input
                value={v.stock}
                inputMode="numeric"
                onChange={(e) => {
                  const next = [...draft.variants];
                  next[i] = { ...v, stock: e.target.value.replace(/[^\d]/g, "") };
                  set("variants", next);
                }}
                style={{ ...inputStyle(c), width: 56, padding: "6px 9px" }}
              />
            </div>
            <div style={{ width: 84 }}>
              <Check
                on={v.soldOut}
                onClick={() => {
                  const next = [...draft.variants];
                  next[i] = { ...v, soldOut: !v.soldOut };
                  set("variants", next);
                }}
              />
            </div>
            <button
              aria-label={`Remove ${v.label || "variant"}`}
              onClick={() => set("variants", draft.variants.filter((_, j) => j !== i))}
              style={{
                width: 30,
                background: "none",
                border: "none",
                color: c.faint,
                cursor: "pointer",
              }}
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}

        <button
          onClick={() => set("variants", [...draft.variants, { label: "", stock: "0", soldOut: false }])}
          className="flex items-center"
          style={{
            ...t.label,
            fontSize: 10,
            gap: 7,
            paddingTop: 9,
            background: "none",
            border: "none",
            color: c.accent,
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={12} />
          Add variant
        </button>
      </div>

      {/* Availability */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <SectionLabel>Availability</SectionLabel>
        {MERCH_STATUSES.map((status) => {
          const on = draft.status === status;
          return (
            <button
              key={status}
              onClick={() => set("status", status)}
              className="flex text-left"
              style={{
                gap: 12,
                padding: "12px 13px",
                cursor: "pointer",
                backgroundColor: on ? c.accentWash : "transparent",
                border: `1px solid ${on ? c.accent : c.rule}`,
                transition: `border-color ${motion.fast}`,
              }}
            >
              <span
                aria-hidden="true"
                className="flex items-center justify-center shrink-0"
                style={{ width: 15, height: 15, marginTop: 2, border: `1px solid ${on ? c.accent : c.ruleStrong}` }}
              >
                {on && <span style={{ width: 7, height: 7, backgroundColor: c.accent }} />}
              </span>
              <span className="flex flex-col" style={{ gap: 5 }}>
                <span style={{ ...t.label, fontSize: 11, color: on ? c.accent : c.text }}>
                  {STATUS_LABELS[status]}
                </span>
                <span style={{ ...t.bodySmall, color: c.muted }}>{STATUS_NOTES[status]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ gap: 12, paddingTop: 16, borderTop: `1px solid ${c.rule}` }}
      >
        {draft.id ? (
          <button
            onClick={() => onDelete(draft)}
            disabled={busy}
            className="flex items-center"
            style={{
              ...t.label,
              fontSize: 10,
              gap: 7,
              padding: "10px 12px",
              color: c.danger,
              background: "none",
              border: `1px solid ${c.danger}`,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            <Icon name="trash" size={12} />
            Delete item
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center" style={{ gap: 9 }}>
          <button
            onClick={onClose}
            style={{
              ...t.label,
              fontSize: 10,
              padding: "10px 14px",
              color: c.muted,
              background: "none",
              border: `1px solid ${c.rule}`,
              cursor: "pointer",
            }}
          >
            Discard
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={busy || !draft.name.trim()}
            style={{
              ...t.label,
              fontSize: 10,
              padding: "10px 18px",
              color: "#ffffff",
              backgroundColor: c.accent,
              border: "none",
              opacity: busy || !draft.name.trim() ? 0.5 : 1,
              cursor: busy || !draft.name.trim() ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Saving…" : draft.id ? "Save changes" : "Create item"}
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Editor primitives ──────────────────────────────────────── */

function inputStyle(c: ReturnType<typeof useDS>["c"]): React.CSSProperties {
  return {
    ...t.bodySmall,
    width: "100%",
    color: c.text,
    background: "transparent",
    border: `1px solid ${c.rule}`,
    borderRadius: 0,
    padding: "9px 11px",
    outline: "none",
  };
}

function EditorField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: "decimal" | "numeric";
}) {
  const { c } = useDS();
  return (
    <label className="flex flex-col" style={{ gap: 9 }}>
      <span style={{ ...t.label, fontSize: 10, color: c.faint }}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle(c), resize: "vertical" }}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle(c)}
        />
      )}
    </label>
  );
}

function EditorChip({
  children,
  icon,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  icon: "upload" | "image-plus" | "trash";
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  const { c } = useDS();
  const color = tone === "danger" ? c.danger : c.muted;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center"
      style={{
        ...t.label,
        fontSize: 10,
        gap: 6,
        padding: "8px 9px",
        color,
        background: "none",
        border: `1px solid ${tone === "danger" ? c.danger : c.rule}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon name={icon} size={12} />
      {children}
    </button>
  );
}

function Check({ on, onClick }: { on: boolean; onClick: () => void }) {
  const { c } = useDS();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className="flex items-center justify-center"
      style={{
        width: 17,
        height: 17,
        padding: 0,
        color: "#ffffff",
        backgroundColor: on ? c.accent : "transparent",
        border: `1px solid ${on ? c.accent : c.ruleStrong}`,
        cursor: "pointer",
        transition: `background-color ${motion.fast}`,
      }}
    >
      {on && <Icon name="check" size={11} strokeWidth={2.4} />}
    </button>
  );
}
