"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton, SectionLabel } from "./AdminShell";
import Icon from "./icons";

/**
 * Admin → Officers.
 *
 * Note what this screen deliberately cannot do: add or remove an officer. Who
 * sits on the board is `User.role`, edited in People & Roles, and that is the
 * whole point of §7.4 — a turnover is a role change, not a code deploy and not a
 * second roster to keep in step. This screen only dresses the people the roles
 * already put there: a portrait, a line about them, when they started, socials.
 *
 * So an empty list here is not a bug, it is an instruction to go and assign a
 * role first.
 */

type Officer = {
  userId: string;
  studentId: string;
  name: string;
  role: string;
  roleTitle: string;
  course: string;
  email: string;
  tagline: string;
  photo: string | null;
  since: string;
  instagram: string;
  linkedin: string;
  order: number;
  published: boolean;
  hasProfile: boolean;
};

type Draft = Pick<
  Officer,
  "tagline" | "photo" | "since" | "instagram" | "linkedin" | "order" | "published"
>;

const toDraft = (o: Officer): Draft => ({
  tagline: o.tagline,
  photo: o.photo,
  since: o.since,
  instagram: o.instagram,
  linkedin: o.linkedin,
  order: o.order,
  published: o.published,
});

export default function OfficersManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ tone: "danger" | "positive"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/officers");
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOfficers(data.officers ?? []);
      setSelected((prev) => prev ?? data.officers?.[0]?.userId ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const current = useMemo(
    () => officers.find((o) => o.userId === selected) ?? null,
    [officers, selected]
  );

  // The draft follows the selection. Adjusted during render rather than in an
  // effect, which would show the previous officer's copy for a frame.
  const [prevSelected, setPrevSelected] = useState<string | null>(null);
  if (selected !== prevSelected) {
    setPrevSelected(selected);
    setDraft(current ? toDraft(current) : null);
    setMessage(null);
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return officers;
    return officers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.roleTitle.toLowerCase().includes(q) ||
        o.studentId.includes(q)
    );
  }, [officers, query]);

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  async function save() {
    if (!current || !draft) return;
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/admin/officers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: current.userId, ...draft }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't save this profile." });
      return;
    }
    setMessage({ tone: "positive", text: "Profile saved." });
    void load();
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("bucket", "events");
    fd.append("files", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await up.json().catch(() => ({}));
    setBusy(false);
    if (!up.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't upload that portrait." });
      return;
    }
    set({ photo: data.urls?.[0] ?? null });
    if (fileRef.current) fileRef.current.value = "";
  }

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <label className="flex flex-col" style={{ gap: 7 }}>
      <SectionLabel>{label}</SectionLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...t.body,
          width: "100%",
          padding: "0.7rem 0.85rem",
          color: c.text,
          background: "transparent",
          border: `1px solid ${c.rule}`,
          borderRadius: 0,
          outline: "none",
        }}
      />
    </label>
  );

  return (
    <AdminShell
      user={user}
      breadcrumb="Officers"
      searchPlaceholder="Search the board…"
      searchValue={query}
      onSearchChange={setQuery}
    >
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${officers.length} ON THE BOARD`}
          title="Officers"
          subtitle="The public roster is built from account roles. Assign the role in People & Roles; dress the profile here."
          actions={
            <Link href="/admin/people" style={{ textDecoration: "none" }}>
              <AdminButton variant="ghost" icon="people">
                PEOPLE &amp; ROLES
              </AdminButton>
            </Link>
          }
        />

        {message && (
          <div
            style={{
              ...t.bodySmall,
              padding: "12px 14px",
              color: c.text,
              backgroundColor: message.tone === "danger" ? c.dangerWash : c.positiveWash,
              border: `1px solid ${message.tone === "danger" ? c.danger : c.positive}`,
            }}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p style={{ ...t.body, color: c.faint }}>Loading the board…</p>
        ) : officers.length === 0 ? (
          <div
            className="flex flex-col items-start"
            style={{ gap: 12, padding: "2rem", border: `1px solid ${c.rule}` }}
          >
            <SectionLabel>No officers yet</SectionLabel>
            <p style={{ ...t.body, color: c.muted, margin: 0, maxWidth: "34rem" }}>
              Nobody holds an officer role. Give a member one in People &amp; Roles and they
              appear here — and on the public Officers page — straight away.
            </p>
            <Link href="/admin/people" style={{ textDecoration: "none" }}>
              <AdminButton icon="people">OPEN PEOPLE &amp; ROLES</AdminButton>
            </Link>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] items-start"
            style={{ gap: "clamp(1.25rem, 3vw, 2rem)" }}
          >
            {/* The board */}
            <div className="flex flex-col" style={{ border: `1px solid ${c.rule}` }}>
              {shown.map((o) => {
                const on = o.userId === selected;
                return (
                  <button
                    key={o.userId}
                    onClick={() => setSelected(o.userId)}
                    className="flex items-center text-left cursor-pointer"
                    style={{
                      gap: 12,
                      padding: "0.8rem 0.9rem",
                      background: on ? c.accentWash : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${c.rule}`,
                      borderLeft: `2px solid ${on ? c.accent : "transparent"}`,
                      transition: `background-color ${motion.fast}`,
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        width: 34,
                        height: 34,
                        color: c.faint,
                        backgroundColor: c.panel,
                        border: `1px solid ${c.rule}`,
                      }}
                    >
                      {o.photo ? (
                        <Image src={o.photo} alt="" width={34} height={34} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="image" size={13} />
                      )}
                    </span>
                    <span className="flex flex-col min-w-0" style={{ gap: 2 }}>
                      <span style={{ ...t.body, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {o.name}
                      </span>
                      <span style={{ ...t.label, color: on ? c.accent : c.faint }}>{o.roleTitle}</span>
                    </span>
                    {!o.published && (
                      <span style={{ ...t.label, marginLeft: "auto", color: c.faint }}>HIDDEN</span>
                    )}
                  </button>
                );
              })}
              {shown.length === 0 && (
                <p style={{ ...t.bodySmall, color: c.faint, padding: "1rem" }}>
                  Nobody on the board matches “{query}”.
                </p>
              )}
            </div>

            {/* The profile */}
            {current && draft && (
              <div className="flex flex-col" style={{ gap: 18 }}>
                <div
                  className="flex flex-col"
                  style={{ gap: 6, padding: "1rem 1.1rem", border: `1px solid ${c.rule}`, backgroundColor: c.panel }}
                >
                  <span style={{ ...t.subheading, color: c.text }}>{current.name}</span>
                  <span style={{ ...t.bodySmall, color: c.muted }}>
                    {current.roleTitle} · {current.course} · {current.studentId}
                  </span>
                  <span style={{ ...t.bodySmall, color: c.faint }}>
                    Name, course and email come from the account and are edited there.
                  </span>
                </div>

                <div className="flex" style={{ gap: 14 }}>
                  <div
                    className="flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ width: 120, height: 130, color: c.faint, backgroundColor: c.surface, border: `1px solid ${c.rule}` }}
                  >
                    {draft.photo ? (
                      <Image src={draft.photo} alt="" width={120} height={130} className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="image" size={22} />
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: 9 }}>
                    <SectionLabel>Portrait</SectionLabel>
                    <span style={{ ...t.bodySmall, color: c.muted, maxWidth: "24rem" }}>
                      One official photo. Portrait crop reads best on the roster.
                    </span>
                    <div className="flex" style={{ gap: 8 }}>
                      <AdminButton variant="ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
                        {draft.photo ? "REPLACE" : "UPLOAD"}
                      </AdminButton>
                      {draft.photo && (
                        <AdminButton variant="ghost" onClick={() => set({ photo: null })} disabled={busy}>
                          REMOVE
                        </AdminButton>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
                  </div>
                </div>

                <label className="flex flex-col" style={{ gap: 7 }}>
                  <SectionLabel>Tagline</SectionLabel>
                  <textarea
                    rows={3}
                    value={draft.tagline}
                    onChange={(e) => set({ tagline: e.target.value })}
                    placeholder="One signature line — their focus for the term."
                    style={{
                      ...t.body,
                      width: "100%",
                      padding: "0.7rem 0.85rem",
                      color: c.text,
                      background: "transparent",
                      border: `1px solid ${c.rule}`,
                      borderRadius: 0,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 14 }}>
                  {field("Role since", draft.since, (v) => set({ since: v }), "Aug 2026")}
                  {field("Order within role", String(draft.order), (v) =>
                    set({ order: Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0 })
                  )}
                  {field("Instagram", draft.instagram, (v) => set({ instagram: v }), "https://instagram.com/…")}
                  {field("LinkedIn", draft.linkedin, (v) => set({ linkedin: v }), "https://linkedin.com/in/…")}
                </div>

                <label className="flex items-center cursor-pointer" style={{ gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={(e) => set({ published: e.target.checked })}
                  />
                  <span className="flex flex-col" style={{ gap: 2 }}>
                    <span style={{ ...t.body, color: c.text }}>Show on the public Officers page</span>
                    <span style={{ ...t.bodySmall, color: c.faint }}>
                      Unticking hides them from the page without touching their role, which would
                      take their console access with it.
                    </span>
                  </span>
                </label>

                <div className="flex" style={{ gap: 10 }}>
                  <AdminButton onClick={save} disabled={busy}>
                    {busy ? "SAVING…" : "SAVE PROFILE"}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={() => setDraft(toDraft(current))}
                    disabled={busy}
                  >
                    DISCARD
                  </AdminButton>
                </div>
              </div>
            )}
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}
