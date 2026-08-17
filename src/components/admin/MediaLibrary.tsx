"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { safeUser } from "@/types/auth";
import { useDS, useConfirm } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton } from "./AdminShell";
import Icon from "./icons";

type MediaItem = {
  url: string;
  eventId: string;
  eventName: string;
  kind: "cover" | "card" | "gallery";
  galleryIndex?: number;
};

const KIND_LABEL: Record<string, string> = { cover: "Cover", card: "Card", gallery: "Gallery" };
const fileNameOf = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || url).split("?")[0];
  } catch {
    return url;
  }
};

export default function MediaLibrary({ user }: { user: safeUser }) {
  const { c } = useDS();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<"all" | "cover" | "card" | "gallery">("all");
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => !d.error && setItems(d.items))
      .catch(() => {});
  };
  useEffect(load, []);

  const filtered = useMemo(() => (filter === "all" ? items : items.filter((i) => i.kind === filter)), [items, filter]);
  const counts = useMemo(() => {
    const c2: Record<string, number> = { all: items.length, cover: 0, card: 0, gallery: 0 };
    for (const i of items) c2[i.kind]++;
    return c2;
  }, [items]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("bucket", "events");
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd }).then((r) => r.json());
      if (res.urls) setUploaded((prev) => [...res.urls, ...prev]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const takeDown = async (item: MediaItem) => {
    const confirmed = await confirm({
      title: "Take this image down?",
      body: `It will stop appearing on “${item.eventName}” and anywhere else the site shows it. The file itself stays in storage.`,
      confirmLabel: "Take down",
      danger: true,
    });
    if (!confirmed) return;
    let body: Record<string, unknown>;
    if (item.kind === "cover") body = { image: null };
    else if (item.kind === "card") body = { cardImage: null };
    else {
      const ev = await fetch(`/api/events/${item.eventId}`).then((r) => r.json());
      body = { gallery: (ev.gallery ?? []).filter((u: string) => u !== item.url) };
    }
    const res = await fetch(`/api/events/${item.eventId}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) load();
  };

  const chips: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "cover", label: "Cover" },
    { key: "card", label: "Card" },
    { key: "gallery", label: "Gallery" },
  ];

  return (
    <AdminShell user={user} breadcrumb="Media Library" searchPlaceholder="Search images…">
      {dialog}
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${items.length} IMAGES ON THE SITE`}
          title="Media Library"
          subtitle="Every image the site uses — upload new assets or take down ones that shouldn't be live."
          actions={
            <>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
              <AdminButton icon="upload" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "UPLOADING…" : "UPLOAD"}
              </AdminButton>
            </>
          }
        />

        {/* Dropzone */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center cursor-pointer"
          style={{ gap: 14, height: 104, backgroundColor: c.panel, border: `1px solid ${c.ruleStrong}` }}
        >
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, backgroundColor: c.accentWash, color: c.accent }}>
            <Icon name="image-plus" size={22} />
          </div>
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <span style={{ ...t.body, fontWeight: 600, color: c.text }}>Click to upload images</span>
            <span style={{ ...t.label, fontSize: 10, color: c.faint }}>PNG, JPG or WEBP · up to 50 MB each</span>
          </div>
        </button>

        {/* Recently uploaded (not yet attached to an event) */}
        {uploaded.length > 0 && (
          <div className="flex flex-col" style={{ gap: 10, padding: 16, backgroundColor: c.accentWash, border: `1px solid ${c.rule}` }}>
            <span style={{ ...t.label, color: c.accent }}>JUST UPLOADED — attach these in an event’s editor</span>
            {uploaded.map((u) => (
              <div key={u} className="flex items-center justify-between" style={{ gap: 12 }}>
                <span style={{ ...t.mono, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</span>
                <button onClick={() => navigator.clipboard?.writeText(u)} style={{ ...t.label, fontSize: 10, color: c.text, padding: "6px 10px", border: `1px solid ${c.ruleStrong}`, flexShrink: 0 }}>COPY URL</button>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {chips.map((ch) => {
            const on = filter === ch.key;
            return (
              <button
                key={ch.key}
                onClick={() => setFilter(ch.key)}
                style={{ ...t.label, letterSpacing: "0.08em", padding: "8px 14px", color: on ? "#fff" : c.muted, backgroundColor: on ? c.accent : "transparent", border: `1px solid ${on ? c.accent : c.rule}` }}
              >
                {ch.label} · {counts[ch.key]}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <span style={{ ...t.bodySmall, color: c.muted }}>No images {filter !== "all" ? `of type “${filter}”` : "on the site yet"}.</span>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {filtered.map((item, i) => (
              <div key={`${item.url}-${i}`} className="flex flex-col" style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
                <div
                  className="flex flex-col justify-between"
                  style={{ height: 140, backgroundColor: "#1e1d22", backgroundImage: `url(${item.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                  <div className="flex items-start justify-between" style={{ padding: 9 }}>
                    <span style={{ ...t.label, fontSize: 9, color: "#fff", background: "rgba(0,0,0,0.55)", padding: "3px 8px" }}>{KIND_LABEL[item.kind]}</span>
                    <button
                      onClick={() => takeDown(item)}
                      title="Take down"
                      className="flex items-center justify-center cursor-pointer"
                      style={{ width: 26, height: 26, background: "rgba(0,0,0,0.55)", border: `1px solid ${c.rule}`, color: c.accent }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col" style={{ gap: 3, padding: "11px 12px", borderTop: `1px solid ${c.rule}` }}>
                  <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileNameOf(item.url)}</span>
                  <span style={{ ...t.label, fontSize: 9, color: c.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>USED IN · {item.eventName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}
