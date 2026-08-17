"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { isAdmin } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton } from "./AdminShell";
import Icon, { type IconName } from "./icons";
import { Count, IconBtn, Pill } from "./committee-ui";
import {
  MEMBER_ROLE_LABELS,
  RECRUITING_LABELS,
  type CommitteeDTO,
} from "@/types/committee";

/**
 * Admin → Committees.
 *
 * Two audiences share this screen. The top table sees every committee and can
 * add, order and delete them. A committee's own head sees exactly one row —
 * theirs — and its members see the same row read-only. Which one you are is
 * decided server-side and arrives as `access` on each record, so the UI never
 * has to guess.
 *
 * This screen is the list and nothing else: opening a committee goes to
 * /admin/committees/[id], a page of its own. A committee record carries four
 * unrelated jobs and none of them fit in a gutter beside the table.
 */
export default function CommitteesManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const router = useRouter();
  const admin = isAdmin(user?.role);

  const [committees, setCommittees] = useState<CommitteeDTO[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/committees");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setCommittees(data.committees ?? []);
    else setError(data?.error || "Couldn't load committees.");
    setLoading(false);
  }, []);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return committees;
    return committees.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.slug.includes(q) ||
        (x.blurb ?? "").toLowerCase().includes(q)
    );
  }, [committees, query]);

  const counts = useMemo(
    () => ({
      total: committees.length,
      recruiting: committees.filter((x) => x.recruiting === "RECRUITING").length,
      members: committees.reduce((n, x) => n + x.memberCount, 0),
    }),
    [committees]
  );

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
              ? "One plate serves every committee. Rosters are built from real accounts — a head or co-head seat also hands that person edit access to their own committee."
              : "The committees you hold a seat on. Heads and co-heads can edit theirs; everyone else on the roster has a read-only view."
          }
          actions={
            admin ? (
              <AdminButton icon="plus" onClick={() => router.push("/admin/committees/new")}>
                NEW COMMITTEE
              </AdminButton>
            ) : undefined
          }
        />

        {error && (
          <div
            role="status"
            style={{
              ...t.bodySmall,
              padding: "11px 14px",
              color: c.danger,
              backgroundColor: c.dangerWash,
              border: `1px solid ${c.danger}`,
            }}
          >
            {error}
          </div>
        )}

        {admin && (
          <div className="flex flex-wrap" style={{ gap: 40 }}>
            <Count label="Committees" value={counts.total} />
            <Count label="Recruiting" value={counts.recruiting} />
            <Count label="Seats filled" value={counts.members} />
          </div>
        )}

        <div className="flex flex-col" style={{ gap: 12 }}>
          {query.trim() && (
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint, alignSelf: "flex-end" }}>
              {shown.length} of {committees.length} matching “{query.trim()}”
            </span>
          )}

          <CommitteesTable
            committees={shown}
            loading={loading}
            busy={busy}
            admin={admin}
            onMove={move}
          />
        </div>
      </AdminContent>
    </AdminShell>
  );
}

/* ── List ───────────────────────────────────────────────────── */

function CommitteesTable({
  committees,
  loading,
  busy,
  admin,
  onMove,
}: {
  committees: CommitteeDTO[];
  loading: boolean;
  busy: boolean;
  admin: boolean;
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
        style={{ gap: 16, padding: "11px 18px", borderBottom: `1px solid ${c.rule}` }}
      >
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 40 }}>N°</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, flex: 1 }}>Committee</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 176 }}>Leadership</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 90 }}>Roster</span>
        <span style={{ ...t.label, fontSize: 10, color: c.faint, width: 130 }}>Call</span>
        <span style={{ width: admin ? 124 : 66 }} />
      </div>

      {committees.map((x, i) => (
        <CommitteeRow
          key={x.id}
          committee={x}
          index={i}
          last={i === committees.length - 1}
          busy={busy}
          admin={admin}
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
  onMove,
}: {
  committee: CommitteeDTO;
  index: number;
  last: boolean;
  busy: boolean;
  admin: boolean;
  onMove: (delta: number) => void;
}) {
  const { c } = useDS();
  const head = x.leads[0] ?? null;
  const canEdit = x.access === "EDIT";
  const href = `/admin/committees/${x.id}`;

  return (
    <div
      className="flex flex-col lg:flex-row lg:items-center"
      style={{
        gap: 16,
        padding: "15px 18px",
        borderBottom: last ? "none" : `1px solid ${c.rule}`,
        transition: `background-color ${motion.fast}`,
      }}
    >
      <span style={{ ...t.mono, color: c.faint, width: 40 }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      <Link
        href={href}
        className="flex items-center text-left flex-1 min-w-0"
        style={{ gap: 12, textDecoration: "none" }}
      >
        <span style={{ color: c.accent, display: "flex" }}>
          <Icon name={x.emblem as IconName} size={17} />
        </span>
        <span className="flex flex-col min-w-0" style={{ gap: 3 }}>
          <span className="flex items-center flex-wrap" style={{ gap: 8 }}>
            <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text }}>{x.name}</span>
            {x.track === "DEV" && <Pill tone="quiet" label="Dev track" />}
            {/* The one thing a status column was really for: a committee that
                isn't on the public site. Inline, so it costs no width. */}
            {x.status === "HIDDEN" && <Pill tone="warn" label="Hidden" />}
          </span>
          <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>/{x.slug}</span>
        </span>
      </Link>

      <span className="flex flex-col" style={{ gap: 3, width: 176 }}>
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

      <span style={{ ...t.mono, color: c.muted, width: 90 }}>
        {x.memberCount} {x.memberCount === 1 ? "seat" : "seats"}
      </span>

      <span style={{ width: 130 }}>
        <Pill
          tone={x.recruiting === "RECRUITING" ? "accent" : "quiet"}
          label={
            x.recruiting === "RECRUITING" ? `${x.openSeats} open` : RECRUITING_LABELS[x.recruiting]
          }
        />
      </span>

      <span className="flex items-center" style={{ gap: 6, width: admin ? 124 : 66 }}>
        <Link
          href={href}
          className="flex items-center"
          style={{
            ...t.label,
            fontSize: 10,
            gap: 6,
            padding: "7px 11px",
            color: canEdit ? c.text : c.muted,
            textDecoration: "none",
            border: `1px solid ${c.rule}`,
          }}
        >
          <Icon name={canEdit ? "pencil" : "search"} size={12} />
          {canEdit ? "Edit" : "View"}
        </Link>
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
