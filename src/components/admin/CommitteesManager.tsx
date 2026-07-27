"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { safeUser } from "@/types/auth";
import { isAdmin, roleLabel } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton, SectionLabel } from "./AdminShell";
import Icon, { type IconName } from "./icons";
import {
  COMMITTEE_EMBLEMS,
  COMMITTEE_STATUSES,
  COMMITTEE_TRACKS,
  EMBLEM_LABELS,
  MEMBER_ROLE_LABELS,
  MEMBER_ROLE_NOTES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  RECRUITING_LABELS,
  RECRUITING_NOTES,
  RECRUITING_STATES,
  STATUS_LABELS,
  STATUS_NOTES,
  TRACK_LABELS,
  TRACK_NOTES,
  TRACK_POSITIONS,
  isLeadPosition,
  type CommitteeAccess,
  type CommitteeDTO,
  type CommitteeEmblem,
  type CommitteeMemberRole,
  type CommitteeProjectStatus,
  type CommitteeRecruiting,
  type CommitteeStatus,
  type CommitteeTrack,
  type MemberSearchResultDTO,
} from "@/types/committee";

type Filter = "ALL" | CommitteeStatus;
type Tab = "identity" | "call" | "content" | "roster";

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: "identity", label: "Identity", icon: "committees" },
  { key: "call", label: "Open call", icon: "flag" },
  { key: "content", label: "Content", icon: "clipboard" },
  { key: "roster", label: "Roster", icon: "people" },
];

/** A roster row in the editor. Every row added here comes from an account. */
type DraftMember = {
  userId: string | null;
  name: string;
  studentId: string | null;
  userRole: string | null;
  roleLabel: string;
  position: CommitteeMemberRole;
  bio: string;
};

/** The editor's working copy. Everything is a string until it's saved. */
type Draft = {
  id: string | null;
  access: CommitteeAccess;
  slug: string;
  name: string;
  kicker: string;
  emblem: CommitteeEmblem;
  track: CommitteeTrack;
  mandate: string;
  blurb: string;
  status: CommitteeStatus;
  recruiting: CommitteeRecruiting;
  openSeats: string;
  callBody: string;
  callDeadline: string;
  applyUrl: string;
  contactEmail: string;
  formedYear: string;
  responsibilities: { title: string; description: string }[];
  projects: { title: string; meta: string; status: CommitteeProjectStatus }[];
  facts: { label: string; value: string }[];
  members: DraftMember[];
};

const BLANK: Draft = {
  id: null,
  access: "EDIT",
  slug: "",
  name: "",
  kicker: "",
  emblem: "pen",
  track: "STANDARD",
  mandate: "",
  blurb: "",
  status: "PUBLISHED",
  recruiting: "NOT_YET",
  openSeats: "0",
  callBody: "",
  callDeadline: "",
  applyUrl: "",
  contactEmail: "",
  formedYear: "",
  responsibilities: [],
  projects: [],
  facts: [],
  members: [],
};

function toDraft(x: CommitteeDTO): Draft {
  return {
    id: x.id,
    access: x.access,
    slug: x.slug,
    name: x.name,
    kicker: x.kicker ?? "",
    emblem: x.emblem,
    track: x.track,
    mandate: x.mandate ?? "",
    blurb: x.blurb ?? "",
    status: x.status,
    recruiting: x.recruiting,
    openSeats: String(x.openSeats),
    callBody: x.callBody ?? "",
    callDeadline: x.callDeadline ? x.callDeadline.slice(0, 10) : "",
    applyUrl: x.applyUrl ?? "",
    contactEmail: x.contactEmail ?? "",
    formedYear: x.formedYear ? String(x.formedYear) : "",
    responsibilities: x.responsibilities.map((r) => ({
      title: r.title,
      description: r.description ?? "",
    })),
    projects: x.projects.map((p) => ({ title: p.title, meta: p.meta ?? "", status: p.status })),
    facts: x.facts.map((f) => ({ label: f.label, value: f.value })),
    members: x.members.map((m) => ({
      userId: m.userId,
      name: m.name,
      studentId: m.studentId,
      userRole: m.userRole,
      roleLabel: m.roleLabel ?? "",
      position: m.position,
      bio: m.bio ?? "",
    })),
  };
}

/**
 * Admin → Committees.
 *
 * Two audiences share this screen. The top table sees every committee and can
 * add, order, publish and delete them. A committee's own head sees exactly one
 * row — theirs — and edits its content and roster; its members see the same row
 * read-only. Which one you are is decided server-side and arrives as `access`
 * on each record, so the UI never has to guess.
 */
export default function CommitteesManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const admin = isAdmin(user?.role);

  const [committees, setCommittees] = useState<CommitteeDTO[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "positive"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/committees");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setCommittees(data.committees ?? []);
    else setMessage({ tone: "danger", text: data?.error || "Couldn't load committees." });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return committees
      .filter((x) => filter === "ALL" || x.status === filter)
      .filter(
        (x) =>
          !q ||
          x.name.toLowerCase().includes(q) ||
          x.slug.includes(q) ||
          (x.blurb ?? "").toLowerCase().includes(q)
      );
  }, [committees, filter, query]);

  const counts = useMemo(
    () => ({
      total: committees.length,
      published: committees.filter((x) => x.status === "PUBLISHED").length,
      recruiting: committees.filter((x) => x.recruiting === "RECRUITING").length,
      members: committees.reduce((n, x) => n + x.memberCount, 0),
    }),
    [committees]
  );

  async function save(d: Draft) {
    setBusy(true);
    setMessage(null);

    const payload = {
      name: d.name,
      kicker: d.kicker,
      emblem: d.emblem,
      track: d.track,
      mandate: d.mandate,
      blurb: d.blurb,
      status: d.status,
      recruiting: d.recruiting,
      openSeats: Number(d.openSeats || 0),
      callBody: d.callBody,
      callDeadline: d.callDeadline,
      applyUrl: d.applyUrl,
      contactEmail: d.contactEmail,
      formedYear: d.formedYear,
      responsibilities: d.responsibilities,
      projects: d.projects,
      facts: d.facts,
      members: d.members,
    };

    const res = await fetch(d.id ? `/api/admin/committees/${d.id}` : "/api/admin/committees", {
      method: d.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't save the committee." });
      return;
    }

    // The server reconciles RECRUITING against the seat count — say so rather
    // than silently showing the admin something they didn't choose.
    const saved: CommitteeDTO | null = data.committee ?? null;
    const coerced = saved && d.recruiting === "RECRUITING" && saved.recruiting !== "RECRUITING";

    setMessage({
      tone: "positive",
      text: coerced
        ? "Saved as roster full — recruiting needs at least one open seat."
        : d.id
          ? "Committee saved."
          : "Committee created.",
    });
    setDraft(null);
    void load();
  }

  async function remove(d: Draft) {
    if (!d.id) return;
    if (
      !window.confirm(
        `Delete "${d.name}"? The roster and open call go with it. Hiding it instead keeps the record.`
      )
    ) {
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/admin/committees/${d.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't delete the committee." });
      return;
    }
    setMessage({ tone: "positive", text: "Committee deleted." });
    setDraft(null);
    void load();
  }

  /** Reordering is the index's numbering — N° 01 follows this list. */
  async function move(x: CommitteeDTO, delta: number) {
    const ordered = [...committees];
    const from = ordered.findIndex((i) => i.id === x.id);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= ordered.length) return;

    ordered.splice(to, 0, ordered.splice(from, 1)[0]);
    setCommittees(ordered);
    setBusy(true);

    await Promise.all(
      ordered.map((item, i) =>
        fetch(`/api/admin/committees/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
        })
      )
    );

    setBusy(false);
    void load();
  }

  return (
    <AdminShell
      user={user}
      breadcrumb="Committees"
      searchPlaceholder="Search committees…"
      searchValue={query}
      onSearchChange={setQuery}
    >
      <AdminContent>
        <AdminPageHeader
          eyebrow="MANAGE"
          title="Committees"
          subtitle={
            admin
              ? "One plate serves every committee. Rosters are built from real accounts — a head or co-head seat also hands that person edit access to their own committee here."
              : "The committees you hold a seat on. Heads and co-heads can edit theirs; everyone else on the roster has a read-only view."
          }
          actions={
            admin ? (
              <AdminButton icon="plus" onClick={() => setDraft({ ...BLANK })}>
                New committee
              </AdminButton>
            ) : undefined
          }
        />

        {message && (
          <div
            role="status"
            style={{
              ...t.bodySmall,
              padding: "11px 14px",
              color: message.tone === "danger" ? c.danger : c.positive,
              backgroundColor: message.tone === "danger" ? c.dangerWash : c.positiveWash,
              border: `1px solid ${message.tone === "danger" ? c.danger : c.positive}`,
            }}
          >
            {message.text}
          </div>
        )}

        {admin && (
          <div className="flex flex-wrap" style={{ gap: 40 }}>
            <Count label="Committees" value={counts.total} />
            <Count label="Published" value={counts.published} />
            <Count label="Recruiting" value={counts.recruiting} />
            <Count label="Seats filled" value={counts.members} />
          </div>
        )}

        <div className="flex flex-col" style={{ gap: 16 }}>
          <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
            <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
              {(["ALL", ...COMMITTEE_STATUSES] as Filter[]).map((f) => (
                <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f === "ALL" ? "All" : STATUS_LABELS[f]}
                </FilterChip>
              ))}
            </div>
            {query.trim() && (
              <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
                {shown.length} of {committees.length} matching “{query.trim()}”
              </span>
            )}
          </div>

          <CommitteesTable
            committees={shown}
            loading={loading}
            busy={busy}
            admin={admin}
            activeId={draft?.id ?? null}
            onOpen={(x) => setDraft(toDraft(x))}
            onMove={move}
          />
        </div>
      </AdminContent>

      {draft && (
        <CommitteeDrawer
          draft={draft}
          busy={busy}
          admin={admin}
          onChange={setDraft}
          onClose={() => setDraft(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </AdminShell>
  );
}

/* ── List ───────────────────────────────────────────────────── */

function CommitteesTable({
  committees,
  loading,
  busy,
  admin,
  activeId,
  onOpen,
  onMove,
}: {
  committees: CommitteeDTO[];
  loading: boolean;
  busy: boolean;
  admin: boolean;
  activeId: string | null;
  onOpen: (x: CommitteeDTO) => void;
  onMove: (x: CommitteeDTO, delta: number) => void;
}) {
  const { c } = useDS();

  if (loading) {
    return <span style={{ ...t.bodySmall, color: c.muted }}>Loading committees…</span>;
  }

  if (committees.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ gap: 12, padding: "56px 20px", border: `1px solid ${c.rule}`, color: c.faint }}
      >
        <Icon name="committees" size={30} />
        <span style={{ ...t.label, color: c.muted }}>No committees here</span>
        <span style={{ ...t.bodySmall, color: c.faint, maxWidth: 380 }}>
          {admin
            ? "Members currently see the index's empty state. The first committee you publish fills the page."
            : "You don't hold a seat on any committee yet. A head can add you from their roster."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ border: `1px solid ${c.rule}` }}>
      <div
        className="hidden lg:flex items-center"
        style={{ gap: 14, padding: "11px 16px", borderBottom: `1px solid ${c.rule}` }}
      >
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 40 }}>N°</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, flex: 1 }}>Committee</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 150 }}>Leadership</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 84 }}>Roster</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 118 }}>Call</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 92 }}>Status</span>
        <span style={{ width: admin ? 120 : 62 }} />
      </div>

      {committees.map((x, i) => (
        <CommitteeRow
          key={x.id}
          committee={x}
          index={i}
          last={i === committees.length - 1}
          busy={busy}
          admin={admin}
          active={activeId === x.id}
          onOpen={() => onOpen(x)}
          onMove={(d) => onMove(x, d)}
        />
      ))}
    </div>
  );
}

function CommitteeRow({
  committee: x,
  index,
  last,
  busy,
  admin,
  active,
  onOpen,
  onMove,
}: {
  committee: CommitteeDTO;
  index: number;
  last: boolean;
  busy: boolean;
  admin: boolean;
  active: boolean;
  onOpen: () => void;
  onMove: (delta: number) => void;
}) {
  const { c } = useDS();
  const head = x.leads[0] ?? null;
  const canEdit = x.access === "EDIT";

  return (
    <div
      className="flex flex-col lg:flex-row lg:items-center"
      style={{
        gap: 14,
        padding: "14px 16px",
        borderBottom: last ? "none" : `1px solid ${c.rule}`,
        backgroundColor: active ? c.accentWash : "transparent",
        transition: `background-color ${motion.fast}`,
      }}
    >
      <span style={{ ...t.mono, color: c.faint, width: 40 }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      <button
        onClick={onOpen}
        className="flex items-center text-left flex-1 min-w-0"
        style={{ gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <span style={{ color: c.accent, display: "flex" }}>
          <Icon name={x.emblem as IconName} size={17} />
        </span>
        <span className="flex flex-col min-w-0" style={{ gap: 3 }}>
          <span className="flex items-center" style={{ gap: 8 }}>
            <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text }}>{x.name}</span>
            {x.track === "DEV" && <Pill tone="quiet" label="Dev track" />}
          </span>
          <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>/{x.slug}</span>
        </span>
      </button>

      <span className="flex flex-col" style={{ gap: 3, width: 150 }}>
        {head ? (
          <>
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.text }}>{head.name}</span>
            <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
              {MEMBER_ROLE_LABELS[head.position]}
            </span>
          </>
        ) : (
          <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>No head assigned</span>
        )}
      </span>

      <span style={{ ...t.mono, color: c.muted, width: 84 }}>
        {x.memberCount} {x.memberCount === 1 ? "seat" : "seats"}
      </span>

      <span style={{ width: 118 }}>
        <Pill
          tone={x.recruiting === "RECRUITING" ? "accent" : "quiet"}
          label={
            x.recruiting === "RECRUITING" ? `${x.openSeats} open` : RECRUITING_LABELS[x.recruiting]
          }
        />
      </span>

      <span style={{ width: 92 }}>
        <Pill
          tone={x.status === "PUBLISHED" ? "positive" : "quiet"}
          label={STATUS_LABELS[x.status]}
        />
      </span>

      <span className="flex items-center" style={{ gap: 6, width: admin ? 120 : 62 }}>
        <button
          onClick={onOpen}
          className="flex items-center"
          style={{
            ...t.label,
            fontSize: 10,
            gap: 6,
            padding: "7px 11px",
            color: canEdit ? c.text : c.muted,
            background: "none",
            border: `1px solid ${c.rule}`,
            cursor: "pointer",
          }}
        >
          <Icon name={canEdit ? "pencil" : "search"} size={12} />
          {canEdit ? "Edit" : "View"}
        </button>
        {admin && (
          <>
            <IconBtn
              label="Move up"
              icon="chevron-down"
              flip
              disabled={busy || index === 0}
              onClick={() => onMove(-1)}
            />
            <IconBtn
              label="Move down"
              icon="chevron-down"
              disabled={busy || last}
              onClick={() => onMove(1)}
            />
          </>
        )}
      </span>
    </div>
  );
}

/* ── Editor drawer ──────────────────────────────────────────── */

/**
 * The editor is an overlay rather than a column beside the table. A committee
 * record carries four unrelated jobs — identity, the open call, page content
 * and the roster — and the tab strip keeps each of them at a readable width
 * instead of stacking all four into a 28rem gutter.
 */
function CommitteeDrawer({
  draft,
  busy,
  admin,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft;
  busy: boolean;
  admin: boolean;
  onChange: (d: Draft) => void;
  onClose: () => void;
  onSave: (d: Draft) => void;
  onDelete: (d: Draft) => void;
}) {
  const { c } = useDS();
  const [tab, setTab] = useState<Tab>("identity");
  const [mounted, setMounted] = useState(false);
  const readOnly = draft.access !== "EDIT";

  useEffect(() => setMounted(true), []);

  // Escape closes: this covers the whole viewport, so there has to be a way out
  // that isn't hunting for the button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock the page behind the drawer, so scrolling in the drawer doesn't slide
  // the committee list around underneath it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!mounted) return null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    onChange({ ...draft, [key]: value });

  const rowCount =
    draft.responsibilities.length + draft.projects.length + draft.facts.length;

  // Portalled to the body for the same reason Modal is: no ancestor's overflow,
  // transform or stacking context can clip or trap it.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(26, 26, 26, 0.64)" }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={draft.id ? `Committee ${draft.name}` : "New committee"}
        className="relative flex flex-col h-full"
        style={{
          width: "min(46rem, 100vw)",
          // `c.panel` is a 3%-alpha wash meant to sit ON an opaque surface —
          // used as an overlay's own background it just shows the scrim and the
          // page through it. Overlays take the solid surface, like Modal does.
          backgroundColor: c.surface,
          borderLeft: `1px solid ${c.ruleStrong}`,
          boxShadow: "0 20px 56px rgba(26, 26, 26, 0.24)",
        }}
      >
        <div style={{ height: 2, backgroundColor: c.accent, flexShrink: 0 }} />

        {/* Header */}
        <div
          className="flex flex-col shrink-0"
          style={{ gap: 14, padding: "20px 24px 0", borderBottom: `1px solid ${c.rule}` }}
        >
          <div className="flex items-start justify-between" style={{ gap: 16 }}>
            <div className="flex items-center min-w-0" style={{ gap: 13 }}>
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  color: c.accent,
                  backgroundColor: c.accentWash,
                  border: `1px solid ${c.rule}`,
                }}
              >
                <Icon name={draft.emblem as IconName} size={19} />
              </span>
              <div className="flex flex-col min-w-0" style={{ gap: 4 }}>
                <span style={{ ...t.subheading, fontSize: 19, color: c.text }}>
                  {draft.name || "New committee"}
                </span>
                <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
                  {draft.id ? `/committee/${draft.slug}` : "Not published yet"}
                </span>
              </div>
            </div>

            <div className="flex items-center shrink-0" style={{ gap: 10 }}>
              <Pill
                tone={readOnly ? "quiet" : "accent"}
                label={readOnly ? "View only" : admin ? "Full access" : "Committee lead"}
              />
              <button
                aria-label="Close editor"
                onClick={onClose}
                className="flex items-center justify-center"
                style={{
                  background: "none",
                  border: "none",
                  color: c.muted,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <Icon name="x" size={17} />
              </button>
            </div>
          </div>

          <div role="tablist" aria-label="Committee sections" className="flex" style={{ gap: 2 }}>
            {TABS.map((x) => {
              const on = tab === x.key;
              const badge =
                x.key === "roster"
                  ? draft.members.length
                  : x.key === "content"
                    ? rowCount
                    : null;
              return (
                <button
                  key={x.key}
                  onClick={() => setTab(x.key)}
                  role="tab"
                  aria-selected={on}
                  className="flex items-center"
                  style={{
                    ...t.label,
                    fontSize: 10,
                    gap: 7,
                    padding: "11px 14px",
                    background: "none",
                    border: "none",
                    borderBottom: `2px solid ${on ? c.accent : "transparent"}`,
                    color: on ? c.text : c.muted,
                    cursor: "pointer",
                    transition: `color ${motion.fast}`,
                  }}
                >
                  <Icon name={x.icon} size={13} />
                  {x.label}
                  {badge !== null && badge > 0 && (
                    <span style={{ ...t.mono, fontSize: 10, color: c.faint }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {readOnly && (
            <div
              style={{
                ...t.bodySmall,
                fontSize: 12,
                marginBottom: 20,
                padding: "11px 14px",
                color: c.muted,
                border: `1px solid ${c.rule}`,
              }}
            >
              You&apos;re on this committee&apos;s roster, so you can see everything here — but only
              its head, co-head or a chapter officer can change it.
            </div>
          )}

          {tab === "identity" && (
            <IdentityTab
              draft={draft}
              admin={admin}
              readOnly={readOnly}
              set={set}
              onTrackChange={(track) => onChange({ ...draft, track, members: refile(draft.members, track) })}
            />
          )}
          {tab === "call" && <CallTab draft={draft} readOnly={readOnly} set={set} />}
          {tab === "content" && (
            <ContentTab draft={draft} readOnly={readOnly} onChange={onChange} />
          )}
          {tab === "roster" && <RosterTab draft={draft} readOnly={readOnly} onChange={onChange} />}
        </div>

        {/* Actions */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ gap: 12, padding: "16px 24px", borderTop: `1px solid ${c.rule}` }}
        >
          {draft.id && admin ? (
            <button
              onClick={() => onDelete(draft)}
              disabled={busy}
              className="flex items-center"
              style={{
                ...t.label,
                fontSize: 10,
                gap: 6,
                padding: "9px 12px",
                color: c.danger,
                background: "none",
                border: `1px solid ${c.danger}`,
                cursor: busy ? "not-allowed" : "pointer",
              }}
            >
              <Icon name="trash" size={12} />
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center" style={{ gap: 10 }}>
            <AdminButton variant="ghost" onClick={onClose}>
              {readOnly ? "Close" : "Cancel"}
            </AdminButton>
            {!readOnly && (
              <AdminButton
                icon="check"
                disabled={busy || !draft.name.trim()}
                onClick={() => onSave(draft)}
              >
                {busy ? "Saving…" : draft.id ? "Save changes" : "Create committee"}
              </AdminButton>
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
}

/* ── Tabs ───────────────────────────────────────────────────── */

/**
 * Mirrors the server's reconciliation when the track changes, so the roster the
 * admin is looking at is the roster that will be saved. A position the incoming
 * track doesn't have — and a second holder of a single-seat one — becomes that
 * track's rank-and-file seat.
 */
function refile(members: DraftMember[], track: CommitteeTrack): DraftMember[] {
  const positions = TRACK_POSITIONS[track];
  const base = positions[positions.length - 1];
  const used = new Set<CommitteeMemberRole>();

  return members.map((m) => {
    const position = positions.includes(m.position) ? m.position : base;
    if (!isLeadPosition(position) || used.has(position)) return { ...m, position: base };
    used.add(position);
    return { ...m, position };
  });
}

function IdentityTab({
  draft,
  admin,
  readOnly,
  set,
  onTrackChange,
}: {
  draft: Draft;
  admin: boolean;
  readOnly: boolean;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  onTrackChange: (track: CommitteeTrack) => void;
}) {
  const { c } = useDS();
  // Renaming re-slugs the committee and breaks its URL, so the name, the track
  // and visibility are the top table's to change — the same line the API draws.
  const locked = readOnly || !admin;

  return (
    <div className="flex flex-col" style={{ gap: 24 }}>
      <div className="flex flex-col" style={{ gap: 16 }}>
        <SectionLabel>Identity</SectionLabel>
        <EditorField
          label={admin ? "Name" : "Name — set by the chapter officers"}
          value={draft.name}
          onChange={(v) => set("name", v)}
          disabled={locked}
          placeholder="Publications"
        />
        <EditorField
          label="Kicker"
          value={draft.kicker}
          onChange={(v) => set("kicker", v)}
          disabled={readOnly}
          placeholder="STANDING COMMITTEE · AY 2026–27"
        />

        <div className="flex flex-col" style={{ gap: 9 }}>
          <span style={{ ...t.label, fontSize: 10, color: c.faint }}>
            Emblem — the diamond mark on the card and in the hero
          </span>
          <div className="flex flex-wrap" style={{ gap: 7 }}>
            {COMMITTEE_EMBLEMS.map((e) => {
              const on = draft.emblem === e;
              return (
                <button
                  key={e}
                  title={EMBLEM_LABELS[e]}
                  aria-label={EMBLEM_LABELS[e]}
                  aria-pressed={on}
                  disabled={readOnly}
                  onClick={() => set("emblem", e)}
                  className="flex items-center justify-center"
                  style={{
                    width: 38,
                    height: 38,
                    cursor: readOnly ? "not-allowed" : "pointer",
                    color: on ? c.accent : c.muted,
                    backgroundColor: on ? c.accentWash : "transparent",
                    border: `1px solid ${on ? c.accent : c.rule}`,
                    opacity: readOnly && !on ? 0.5 : 1,
                    transition: `border-color ${motion.fast}`,
                  }}
                >
                  <Icon name={e as IconName} size={17} />
                </button>
              );
            })}
          </div>
        </div>

        <EditorField
          label="Card line — the three lines on the index"
          value={draft.blurb}
          onChange={(v) => set("blurb", v)}
          disabled={readOnly}
          multiline
          placeholder="Posters, motion, photo and the chapter's visual voice."
        />
        <EditorField
          label="Mandate — the hero paragraph"
          value={draft.mandate}
          onChange={(v) => set("mandate", v)}
          disabled={readOnly}
          multiline
        />
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <EditorField
            label="Formed"
            value={draft.formedYear}
            onChange={(v) => set("formedYear", v)}
            disabled={readOnly}
            inputMode="numeric"
            placeholder="2023"
          />
          <EditorField
            label="Contact email"
            value={draft.contactEmail}
            onChange={(v) => set("contactEmail", v)}
            disabled={readOnly}
            placeholder="publications.acmx@feu.edu.ph"
          />
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 14 }}>
        <SectionLabel>Roster positions</SectionLabel>
        <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
          Switching tracks re-files the roster — anyone holding a position the new track
          doesn&apos;t have becomes a rank-and-file member.
        </span>
        {COMMITTEE_TRACKS.map((k) => (
          <ChoiceRow
            key={k}
            on={draft.track === k}
            disabled={locked}
            title={TRACK_LABELS[k]}
            note={TRACK_NOTES[k]}
            onClick={() => onTrackChange(k)}
          />
        ))}
      </div>

      <div className="flex flex-col" style={{ gap: 14 }}>
        <SectionLabel>Visibility</SectionLabel>
        {COMMITTEE_STATUSES.map((s) => (
          <ChoiceRow
            key={s}
            on={draft.status === s}
            disabled={locked}
            title={STATUS_LABELS[s]}
            note={STATUS_NOTES[s]}
            onClick={() => set("status", s)}
          />
        ))}
      </div>
    </div>
  );
}

function CallTab({
  draft,
  readOnly,
  set,
}: {
  draft: Draft;
  readOnly: boolean;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const { c } = useDS();
  const seatWarning =
    draft.recruiting === "RECRUITING" && Number(draft.openSeats || 0) <= 0
      ? "Recruiting needs at least one open seat — this will save as roster full."
      : null;

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <SectionLabel>Open call</SectionLabel>
      {RECRUITING_STATES.map((r) => (
        <ChoiceRow
          key={r}
          on={draft.recruiting === r}
          disabled={readOnly}
          title={RECRUITING_LABELS[r]}
          note={RECRUITING_NOTES[r]}
          onClick={() => set("recruiting", r)}
        />
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginTop: 6 }}>
        <EditorField
          label="Open seats"
          value={draft.openSeats}
          onChange={(v) => set("openSeats", v)}
          disabled={readOnly}
          inputMode="numeric"
        />
        <EditorField
          label="Deadline"
          value={draft.callDeadline}
          onChange={(v) => set("callDeadline", v)}
          disabled={readOnly}
          type="date"
        />
      </div>

      {seatWarning && <span style={{ ...t.bodySmall, color: c.danger }}>{seatWarning}</span>}

      <EditorField
        label="Call copy"
        value={draft.callBody}
        onChange={(v) => set("callBody", v)}
        disabled={readOnly}
        multiline
      />
      <EditorField
        label="Apply link — falls back to the contact email"
        value={draft.applyUrl}
        onChange={(v) => set("applyUrl", v)}
        disabled={readOnly}
        placeholder="https://forms.gle/…"
      />
    </div>
  );
}

function ContentTab({
  draft,
  readOnly,
  onChange,
}: {
  draft: Draft;
  readOnly: boolean;
  onChange: (d: Draft) => void;
}) {
  function rows<K extends "responsibilities" | "projects" | "facts">(key: K, next: Draft[K]) {
    onChange({ ...draft, [key]: next });
  }

  return (
    <div className="flex flex-col" style={{ gap: 26 }}>
      <RowGroup
        label="What this committee owns"
        hint="Numbered automatically. Any length; leave it empty and the block hides."
        count={draft.responsibilities.length}
        readOnly={readOnly}
        onAdd={() =>
          rows("responsibilities", [...draft.responsibilities, { title: "", description: "" }])
        }
      >
        {draft.responsibilities.map((r, i) => (
          <RowShell
            key={i}
            index={i}
            total={draft.responsibilities.length}
            readOnly={readOnly}
            onMove={(d) => rows("responsibilities", moveRow(draft.responsibilities, i, d))}
            onRemove={() => rows("responsibilities", dropRow(draft.responsibilities, i))}
          >
            <EditorField
              label="Title"
              value={r.title}
              disabled={readOnly}
              onChange={(v) =>
                rows("responsibilities", patchRow(draft.responsibilities, i, { title: v }))
              }
            />
            <EditorField
              label="Description"
              value={r.description}
              disabled={readOnly}
              multiline
              onChange={(v) =>
                rows("responsibilities", patchRow(draft.responsibilities, i, { description: v }))
              }
            />
          </RowShell>
        ))}
      </RowGroup>

      <RowGroup
        label="Current work"
        hint="Shown with a status pill. Accent means in progress."
        count={draft.projects.length}
        readOnly={readOnly}
        onAdd={() =>
          rows("projects", [...draft.projects, { title: "", meta: "", status: "IN_PROGRESS" }])
        }
      >
        {draft.projects.map((p, i) => (
          <RowShell
            key={i}
            index={i}
            total={draft.projects.length}
            readOnly={readOnly}
            onMove={(d) => rows("projects", moveRow(draft.projects, i, d))}
            onRemove={() => rows("projects", dropRow(draft.projects, i))}
          >
            <EditorField
              label="Title"
              value={p.title}
              disabled={readOnly}
              onChange={(v) => rows("projects", patchRow(draft.projects, i, { title: v }))}
            />
            <EditorField
              label="One-line context"
              value={p.meta}
              disabled={readOnly}
              onChange={(v) => rows("projects", patchRow(draft.projects, i, { meta: v }))}
            />
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {PROJECT_STATUSES.map((s) => (
                <MiniChip
                  key={s}
                  on={p.status === s}
                  disabled={readOnly}
                  onClick={() => rows("projects", patchRow(draft.projects, i, { status: s }))}
                >
                  {PROJECT_STATUS_LABELS[s]}
                </MiniChip>
              ))}
            </div>
          </RowShell>
        ))}
      </RowGroup>

      <RowGroup
        label="At a glance"
        hint="Free key/value rows. A committee with no co-head simply has no co-head row."
        count={draft.facts.length}
        readOnly={readOnly}
        onAdd={() => rows("facts", [...draft.facts, { label: "", value: "" }])}
      >
        {draft.facts.map((f, i) => (
          <RowShell
            key={i}
            index={i}
            total={draft.facts.length}
            readOnly={readOnly}
            onMove={(d) => rows("facts", moveRow(draft.facts, i, d))}
            onRemove={() => rows("facts", dropRow(draft.facts, i))}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
              <EditorField
                label="Label"
                value={f.label}
                disabled={readOnly}
                onChange={(v) => rows("facts", patchRow(draft.facts, i, { label: v }))}
                placeholder="MEETS"
              />
              <EditorField
                label="Value"
                value={f.value}
                disabled={readOnly}
                onChange={(v) => rows("facts", patchRow(draft.facts, i, { value: v }))}
                placeholder="Thursdays · 4:30 PM"
              />
            </div>
          </RowShell>
        ))}
      </RowGroup>
    </div>
  );
}

/* ── Roster ─────────────────────────────────────────────────── */

/**
 * The roster is assembled from accounts, never typed. That's what makes a seat
 * mean something: the head slot on this list is the same record that grants
 * that person edit access to this committee, so there is no way to write a name
 * that no one can sign in as.
 */
function RosterTab({
  draft,
  readOnly,
  onChange,
}: {
  draft: Draft;
  readOnly: boolean;
  onChange: (d: Draft) => void;
}) {
  const { c } = useDS();
  const positions = TRACK_POSITIONS[draft.track];
  const base = positions[positions.length - 1];

  const set = (next: DraftMember[]) => onChange({ ...draft, members: next });

  const taken = useMemo(
    () => new Set(draft.members.filter((m) => isLeadPosition(m.position)).map((m) => m.position)),
    [draft.members]
  );

  function add(person: MemberSearchResultDTO) {
    // The first lead seat still going spare is the useful default: staffing a
    // committee starts at the top, and everyone after that is rank and file.
    const openLead = positions.find((p) => isLeadPosition(p) && !taken.has(p));
    set([
      ...draft.members,
      {
        userId: person.id,
        name: person.name,
        studentId: person.studentId,
        userRole: person.role,
        roleLabel: "",
        position: openLead ?? base,
        bio: "",
      },
    ]);
  }

  const leadSlots = positions.filter(isLeadPosition);

  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      <SectionLabel>Leadership</SectionLabel>
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        {leadSlots.map((p) => {
          const holder = draft.members.find((m) => m.position === p);
          return (
            <div
              key={p}
              className="flex flex-col"
              style={{
                gap: 6,
                flex: "1 1 13rem",
                padding: "12px 14px",
                border: `1px solid ${holder ? c.rule : c.ruleStrong}`,
                backgroundColor: holder ? c.accentWash : "transparent",
              }}
            >
              <span style={{ ...t.label, fontSize: 9, color: holder ? c.accent : c.faint }}>
                {MEMBER_ROLE_LABELS[p]}
              </span>
              <span style={{ ...t.bodySmall, fontSize: 12, color: holder ? c.text : c.faint }}>
                {holder ? holder.name : "Unassigned"}
              </span>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <>
          <SectionLabel>Add from the member directory</SectionLabel>
          <MemberPicker
            exclude={draft.members.map((m) => m.userId).filter((id): id is string => !!id)}
            onPick={add}
          />
        </>
      )}

      <SectionLabel>
        The roster · {draft.members.length} {draft.members.length === 1 ? "seat" : "seats"}
      </SectionLabel>

      {draft.members.length === 0 ? (
        <div
          className="flex flex-col items-center text-center"
          style={{ gap: 9, padding: "34px 20px", border: `1px dashed ${c.rule}` }}
        >
          <span style={{ color: c.faint, display: "flex" }}>
            <Icon name="people" size={24} />
          </span>
          <span style={{ ...t.label, fontSize: 10, color: c.muted }}>No seats filled</span>
          <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint, maxWidth: 320 }}>
            {readOnly
              ? "This committee hasn't published its roster yet."
              : "Search above to add someone. The plate shows its roster empty state until then."}
          </span>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {draft.members.map((m, i) => (
            <RosterRow
              key={m.userId ?? `unlinked-${i}`}
              member={m}
              index={i}
              total={draft.members.length}
              positions={positions}
              taken={taken}
              readOnly={readOnly}
              onPatch={(patch) => set(patchRow(draft.members, i, patch))}
              onMove={(d) => set(moveRow(draft.members, i, d))}
              onRemove={() => set(dropRow(draft.members, i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RosterRow({
  member: m,
  index,
  total,
  positions,
  taken,
  readOnly,
  onPatch,
  onMove,
  onRemove,
}: {
  member: DraftMember;
  index: number;
  total: number;
  positions: readonly CommitteeMemberRole[];
  taken: Set<CommitteeMemberRole>;
  readOnly: boolean;
  onPatch: (patch: Partial<DraftMember>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const { c } = useDS();
  const lead = isLeadPosition(m.position);

  return (
    <div
      className="flex flex-col"
      style={{
        gap: 12,
        padding: 14,
        border: `1px solid ${lead ? c.ruleStrong : c.rule}`,
        // A wash over the drawer's opaque surface — the recess reads, and it
        // can't disappear the way a second copy of `surface` would.
        backgroundColor: c.panel,
      }}
    >
      <div className="flex items-start justify-between" style={{ gap: 12 }}>
        <div className="flex items-center min-w-0" style={{ gap: 11 }}>
          <Avatar name={m.name} />
          <div className="flex flex-col min-w-0" style={{ gap: 3 }}>
            <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text }}>{m.name}</span>
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
              {m.studentId ?? "No linked account"}
              {m.userRole ? ` · ${roleLabel(m.userRole)}` : ""}
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex shrink-0" style={{ gap: 4 }}>
            <IconBtn
              label="Move up"
              icon="chevron-down"
              flip
              disabled={index === 0}
              onClick={() => onMove(-1)}
            />
            <IconBtn
              label="Move down"
              icon="chevron-down"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            />
            <IconBtn label="Remove from roster" icon="trash" tone="danger" onClick={onRemove} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap" style={{ gap: 6 }}>
        {positions.map((p) => {
          // A single-seat position someone else already holds is shown but
          // inert, so it's obvious the slot exists and who has it.
          const claimed = isLeadPosition(p) && taken.has(p) && m.position !== p;
          return (
            <MiniChip
              key={p}
              on={m.position === p}
              disabled={readOnly || claimed}
              title={claimed ? `${MEMBER_ROLE_LABELS[p]} is already assigned` : MEMBER_ROLE_NOTES[p]}
              onClick={() => onPatch({ position: p })}
            >
              {MEMBER_ROLE_LABELS[p]}
            </MiniChip>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
        <EditorField
          label="Lane — the line under the portrait"
          value={m.roleLabel}
          disabled={readOnly}
          onChange={(v) => onPatch({ roleLabel: v })}
          placeholder="LAYOUT"
        />
        {lead && (
          <EditorField
            label="Lead line — shown on the wide card"
            value={m.bio}
            disabled={readOnly}
            onChange={(v) => onPatch({ bio: v })}
          />
        )}
      </div>
    </div>
  );
}

/** Debounced typeahead over the account directory. */
function MemberPicker({
  exclude,
  onPick,
}: {
  exclude: string[];
  onPick: (person: MemberSearchResultDTO) => void;
}) {
  const { c } = useDS();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResultDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const excludeKey = exclude.join(",");

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    setSearching(true);
    setError(null);

    // Aborting the in-flight request is what keeps a slow early reply from
    // landing on top of a newer one — and it cancels the work server-side too.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (excludeKey) params.set("exclude", excludeKey);

        const res = await fetch(`/api/admin/members/search?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // Silence here is the worst outcome: a failed request and a genuinely
          // empty directory look identical unless we say which one happened.
          setResults([]);
          setError(
            data?.error ||
              (res.status === 403
                ? "You don't have permission to search the directory."
                : `The directory search failed (${res.status}).`)
          );
        } else {
          setResults(data.results ?? []);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setResults([]);
        setError("Couldn't reach the directory. Check your connection and try again.");
      } finally {
        // Without this the picker hangs on "Searching…" the moment anything throws.
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, excludeKey]);

  const q = query.trim();

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Name, student number, email or program…"
      />

      {q.length > 0 && (
        <div
          className="flex flex-col"
          style={{
            border: `1px solid ${error ? c.danger : c.ruleStrong}`,
            backgroundColor: c.panel,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {searching && (
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint, padding: "12px 14px" }}>
              Searching the directory…
            </span>
          )}

          {!searching && error && (
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.danger, padding: "12px 14px" }}>
              {error}
            </span>
          )}

          {!searching && !error && results.length === 0 && (
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint, padding: "12px 14px" }}>
              Nobody matches “{q}”. Anyone already on this roster is filtered out — check People
              &amp; Roles if the account should exist.
            </span>
          )}

          {!searching &&
            !error &&
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => {
                  onPick(r);
                  setQuery("");
                  setResults([]);
                }}
                className="flex items-center text-left"
                style={{
                  gap: 11,
                  padding: "11px 14px",
                  background: "none",
                  border: "none",
                  borderTop: i === 0 ? "none" : `1px solid ${c.rule}`,
                  cursor: "pointer",
                }}
              >
                <Avatar name={r.name} />
                <span className="flex flex-col min-w-0 flex-1" style={{ gap: 3 }}>
                  <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text }}>{r.name}</span>
                  <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
                    {r.studentId} · {r.degreeProgram} · Year {r.yearLevel}
                  </span>
                </span>
                <Pill tone="quiet" label={roleLabel(r.role)} />
                <span style={{ color: c.accent, display: "flex" }}>
                  <Icon name="plus" size={14} />
                </span>
              </button>
            ))}
        </div>
      )}

    </div>
  );
}

/* ── Row helpers ────────────────────────────────────────────── */

function patchRow<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

function dropRow<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

function moveRow<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(index, 1)[0]);
  return next;
}

function RowGroup({
  label,
  hint,
  count,
  readOnly,
  onAdd,
  children,
}: {
  label: string;
  hint: string;
  count: number;
  readOnly?: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <SectionLabel>
        {label} · {count}
      </SectionLabel>
      <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>{hint}</span>
      {children}
      {!readOnly && (
        <button
          onClick={onAdd}
          className="flex items-center justify-center"
          style={{
            ...t.label,
            fontSize: 10,
            gap: 6,
            padding: "9px 12px",
            color: c.muted,
            background: "none",
            border: `1px dashed ${c.rule}`,
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={12} />
          Add row
        </button>
      )}
    </div>
  );
}

function RowShell({
  index,
  total,
  readOnly,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  readOnly?: boolean;
  onMove: (delta: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <div
      className="flex flex-col"
      style={{ gap: 12, padding: 14, border: `1px solid ${c.rule}`, backgroundColor: c.panel }}
    >
      <div className="flex items-center justify-between">
        <span style={{ ...t.label, fontSize: 10, color: c.faint }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {!readOnly && (
          <div className="flex" style={{ gap: 4 }}>
            <IconBtn
              label="Move up"
              icon="chevron-down"
              flip
              disabled={index === 0}
              onClick={() => onMove(-1)}
            />
            <IconBtn
              label="Move down"
              icon="chevron-down"
              disabled={index === total - 1}
              onClick={() => onMove(1)}
            />
            <IconBtn label="Remove row" icon="trash" tone="danger" onClick={onRemove} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Primitives ─────────────────────────────────────────────── */

function inputStyle(c: ReturnType<typeof useDS>["c"], disabled?: boolean): React.CSSProperties {
  return {
    ...t.bodySmall,
    width: "100%",
    color: disabled ? c.muted : c.text,
    background: "transparent",
    border: `1px solid ${c.rule}`,
    borderRadius: 0,
    padding: "9px 11px",
    outline: "none",
    cursor: disabled ? "not-allowed" : "auto",
  };
}

function EditorField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  inputMode,
  type,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: "decimal" | "numeric";
  type?: string;
  disabled?: boolean;
}) {
  const { c } = useDS();
  return (
    <label className="flex flex-col" style={{ gap: 9 }}>
      <span style={{ ...t.label, fontSize: 10, color: c.faint }}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle(c, disabled), resize: "vertical" }}
        />
      ) : (
        <input
          value={value}
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle(c, disabled)}
        />
      )}
    </label>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { c } = useDS();
  return (
    <div
      className="flex items-center"
      style={{ gap: 9, padding: "0 11px", width: "100%", border: `1px solid ${c.ruleStrong}` }}
    >
      <span style={{ color: c.faint, display: "flex" }}>
        <Icon name="search" size={14} />
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...t.bodySmall,
          flex: 1,
          minWidth: 0,
          padding: "10px 0",
          color: c.text,
          background: "transparent",
          border: "none",
          outline: "none",
        }}
      />
      {value && (
        <button
          aria-label="Clear"
          onClick={() => onChange("")}
          style={{ background: "none", border: "none", color: c.faint, cursor: "pointer", padding: 0 }}
        >
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  );
}

/** Initials block. The chapter has no avatar uploads, so this is the portrait. */
function Avatar({ name }: { name: string }) {
  const { c } = useDS();
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center shrink-0"
      style={{
        ...t.label,
        fontSize: 10,
        width: 34,
        height: 34,
        color: c.accent,
        backgroundColor: c.accentWash,
        border: `1px solid ${c.rule}`,
      }}
    >
      {initials}
    </span>
  );
}

/** A radio row that explains what the choice does — the three-way states use it. */
function ChoiceRow({
  on,
  title,
  note,
  disabled,
  onClick,
}: {
  on: boolean;
  title: string;
  note: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={on}
      disabled={disabled}
      className="flex text-left"
      style={{
        gap: 12,
        padding: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        background: on ? c.accentWash : "transparent",
        border: `1px solid ${on ? c.accent : c.rule}`,
        opacity: disabled && !on ? 0.55 : 1,
        transition: `border-color ${motion.fast}`,
      }}
    >
      <span
        aria-hidden="true"
        className="shrink-0"
        style={{
          width: 13,
          height: 13,
          marginTop: 3,
          backgroundColor: on ? c.accent : "transparent",
          border: `1px solid ${on ? c.accent : c.ruleStrong}`,
        }}
      />
      <span className="flex flex-col" style={{ gap: 5 }}>
        <span style={{ ...t.label, fontSize: 10, color: on ? c.text : c.muted }}>{title}</span>
        <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>{note}</span>
      </span>
    </button>
  );
}

function MiniChip({
  on,
  onClick,
  disabled,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
      title={title}
      style={{
        ...t.label,
        fontSize: 10,
        padding: "6px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: on ? c.accent : c.muted,
        backgroundColor: on ? c.accentWash : "transparent",
        border: `1px solid ${on ? c.accent : c.rule}`,
        opacity: disabled && !on ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function IconBtn({
  label,
  icon,
  onClick,
  disabled,
  flip,
  tone = "neutral",
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  disabled?: boolean;
  flip?: boolean;
  tone?: "neutral" | "danger";
}) {
  const { c } = useDS();
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center"
      style={{
        width: 27,
        height: 27,
        padding: 0,
        color: tone === "danger" ? c.danger : c.muted,
        background: "none",
        border: `1px solid ${tone === "danger" ? c.danger : c.rule}`,
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon name={icon} size={13} style={flip ? { transform: "rotate(180deg)" } : undefined} />
    </button>
  );
}

function Pill({ tone, label }: { tone: "accent" | "positive" | "quiet"; label: string }) {
  const { c } = useDS();
  const tones = {
    accent: { fg: c.accent, bg: c.accentWash, edge: c.accent },
    positive: { fg: c.positive, bg: c.positiveWash, edge: c.positive },
    quiet: { fg: c.faint, bg: "transparent", edge: c.rule },
  };
  const x = tones[tone];
  return (
    <span
      style={{
        ...t.label,
        fontSize: 10,
        padding: "4px 9px",
        whiteSpace: "nowrap",
        color: x.fg,
        backgroundColor: x.bg,
        border: `1px solid ${x.edge}`,
      }}
    >
      {label}
    </span>
  );
}

function FilterChip({
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
        fontSize: 10,
        padding: "8px 13px",
        cursor: "pointer",
        color: active ? "#ffffff" : c.muted,
        backgroundColor: active ? c.accent : "transparent",
        border: `1px solid ${active ? c.accent : c.rule}`,
        transition: `background-color ${motion.fast}`,
      }}
    >
      {children}
    </button>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 5 }}>
      <span style={{ ...t.label, fontSize: 10, color: c.faint }}>{label}</span>
      <span style={{ ...t.mono, fontSize: 15, color: c.text }}>
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}
