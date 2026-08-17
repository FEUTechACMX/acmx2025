"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { isAdmin, roleLabel } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminButton, SectionLabel } from "./AdminShell";
import Icon, { type IconName } from "./icons";
import {
  Avatar,
  BLANK_DRAFT,
  ChoiceRow,
  draftPayload,
  dropRow,
  EditorField,
  IconBtn,
  MiniChip,
  moveRow,
  patchRow,
  Pill,
  refile,
  RowGroup,
  RowShell,
  SearchInput,
  toDraft,
  type Draft,
  type DraftMember,
} from "./committee-ui";
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
  type CommitteeMemberRole,
  type CommitteeTrack,
  type MemberSearchResultDTO,
} from "@/types/committee";

type Tab = "identity" | "call" | "content" | "roster";

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: "identity", label: "Identity", icon: "committees" },
  { key: "call", label: "Open call", icon: "flag" },
  { key: "content", label: "Content", icon: "clipboard" },
  { key: "roster", label: "Roster", icon: "people" },
];

/**
 * Admin → Committees → one committee.
 *
 * A committee record carries four unrelated jobs — identity, the open call,
 * page content and the roster — and each of them wants a readable measure. That
 * is why this is a route of its own rather than a gutter beside the list: the
 * tab strip gets the full width of the console, and the browser's back button
 * is the way out.
 *
 * `id` is a committee id, or the literal "new" to create one.
 */
export default function CommitteeEditor({ user, id }: { user: safeUser; id: string }) {
  const { c } = useDS();
  const router = useRouter();
  const admin = isAdmin(user?.role);
  const creating = id === "new";

  const [draft, setDraft] = useState<Draft | null>(creating ? { ...BLANK_DRAFT } : null);
  const [tab, setTab] = useState<Tab>("identity");
  const [loading, setLoading] = useState(!creating);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "positive"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/committees/${id}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.committee) setDraft(toDraft(data.committee));
    else setMessage({ tone: "danger", text: data?.error || "Couldn't load this committee." });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!creating) void load();
  }, [creating, load]);

  const readOnly = !draft || draft.access !== "EDIT";

  async function save() {
    if (!draft) return;
    setBusy(true);
    setMessage(null);

    const res = await fetch(
      draft.id ? `/api/admin/committees/${draft.id}` : "/api/admin/committees",
      {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload(draft)),
      }
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't save the committee." });
      return;
    }

    const saved = data.committee ?? null;

    // A brand-new committee has just been given an id — move onto its own URL so
    // a reload, or a second save, lands on the record rather than on /new.
    if (!draft.id && saved?.id) {
      router.replace(`/admin/committees/${saved.id}`);
      return;
    }

    if (saved) setDraft(toDraft(saved));

    // The server reconciles RECRUITING against the seat count — say so rather
    // than silently showing the admin something they didn't choose.
    const coerced = saved && draft.recruiting === "RECRUITING" && saved.recruiting !== "RECRUITING";
    setMessage({
      tone: "positive",
      text: coerced
        ? "Saved as roster full — recruiting needs at least one open seat."
        : "Committee saved.",
    });
  }

  async function remove() {
    if (!draft?.id) return;
    if (
      !window.confirm(
        `Delete "${draft.name}"? The roster and open call go with it. Hiding it instead keeps the record.`
      )
    ) {
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/admin/committees/${draft.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setMessage({ tone: "danger", text: data?.error || "Couldn't delete the committee." });
      return;
    }
    router.push("/admin/committees");
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const rowCount = draft
    ? draft.responsibilities.length + draft.projects.length + draft.facts.length
    : 0;

  return (
    <AdminShell user={user} breadcrumb={draft?.name || (creating ? "New committee" : "Committee")}>
      <AdminContent>
        <div className="flex flex-col" style={{ gap: 18 }}>
          <Link
            href="/admin/committees"
            className="flex items-center"
            style={{
              ...t.label,
              fontSize: 10,
              gap: 8,
              alignSelf: "flex-start",
              color: c.muted,
              textDecoration: "none",
            }}
          >
            <span style={{ display: "flex", transform: "rotate(90deg)" }}>
              <Icon name="chevron-down" size={13} />
            </span>
            All committees
          </Link>

          {/* Title row */}
          <div className="flex flex-wrap items-end justify-between" style={{ gap: 16 }}>
            <div className="flex items-center min-w-0" style={{ gap: 15 }}>
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  color: c.accent,
                  backgroundColor: c.accentWash,
                  border: `1px solid ${c.rule}`,
                }}
              >
                <Icon name={(draft?.emblem ?? "committees") as IconName} size={24} />
              </span>
              <div className="flex flex-col min-w-0" style={{ gap: 7 }}>
                <span style={{ ...t.label, color: c.accent }}>
                  {creating ? "NEW COMMITTEE" : "EDIT COMMITTEE"}
                </span>
                <h1 style={{ ...t.title, fontSize: "clamp(1.5rem, 2.6vw, 2rem)", color: c.text }}>
                  {draft?.name || (creating ? "Untitled committee" : "Loading…")}
                </h1>
                <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
                  {draft?.id ? `/committee/${draft.slug}` : "Not published yet"}
                </span>
              </div>
            </div>

            {draft && (
              <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
                <Pill
                  tone={readOnly ? "quiet" : "accent"}
                  label={readOnly ? "View only" : admin ? "Full access" : "Committee lead"}
                />
                {!readOnly && (
                  <AdminButton
                    icon="check"
                    disabled={busy || !draft.name.trim()}
                    onClick={() => void save()}
                  >
                    {busy ? "SAVING…" : draft.id ? "SAVE CHANGES" : "CREATE COMMITTEE"}
                  </AdminButton>
                )}
              </div>
            )}
          </div>

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
        </div>

        {loading && (
          <span style={{ ...t.bodySmall, color: c.muted }}>Loading this committee…</span>
        )}

        {draft && (
          <div className="flex flex-col" style={{ gap: 0 }}>
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Committee sections"
              className="flex flex-wrap"
              style={{ gap: 2, borderBottom: `1px solid ${c.rule}` }}
            >
              {TABS.map((x) => {
                const on = tab === x.key;
                const badge =
                  x.key === "roster" ? draft.members.length : x.key === "content" ? rowCount : null;
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
                      padding: "12px 16px",
                      background: on ? c.accentWash : "none",
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

            {/* Body */}
            <div
              style={{
                padding: "26px clamp(16px, 2vw, 28px)",
                border: `1px solid ${c.rule}`,
                borderTop: "none",
                backgroundColor: c.panel,
              }}
            >
              <div style={{ maxWidth: 860 }}>
                {readOnly && (
                  <div
                    style={{
                      ...t.bodySmall,
                      fontSize: 12,
                      marginBottom: 22,
                      padding: "11px 14px",
                      color: c.muted,
                      border: `1px solid ${c.rule}`,
                    }}
                  >
                    You&apos;re on this committee&apos;s roster, so you can see everything here — but
                    only its head, co-head or a chapter officer can change it.
                  </div>
                )}

                {tab === "identity" && (
                  <IdentityTab
                    draft={draft}
                    admin={admin}
                    readOnly={readOnly}
                    set={set}
                    onTrackChange={(track) =>
                      setDraft((d) =>
                        d ? { ...d, track, members: refile(d.members, track) } : d
                      )
                    }
                  />
                )}
                {tab === "call" && <CallTab draft={draft} readOnly={readOnly} set={set} />}
                {tab === "content" && (
                  <ContentTab draft={draft} readOnly={readOnly} onChange={setDraft} />
                )}
                {tab === "roster" && (
                  <RosterTab draft={draft} readOnly={readOnly} onChange={setDraft} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {draft && (
          <div className="flex items-center justify-between flex-wrap" style={{ gap: 12 }}>
            {draft.id && admin ? (
              <button
                onClick={() => void remove()}
                disabled={busy}
                className="flex items-center"
                style={{
                  ...t.label,
                  fontSize: 10,
                  gap: 6,
                  padding: "10px 13px",
                  color: c.danger,
                  background: "none",
                  border: `1px solid ${c.danger}`,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                <Icon name="trash" size={12} />
                Delete committee
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center" style={{ gap: 10 }}>
              <AdminButton variant="ghost" onClick={() => router.push("/admin/committees")}>
                {readOnly ? "BACK" : "CANCEL"}
              </AdminButton>
              {!readOnly && (
                <AdminButton
                  icon="check"
                  disabled={busy || !draft.name.trim()}
                  onClick={() => void save()}
                >
                  {busy ? "SAVING…" : draft.id ? "SAVE CHANGES" : "CREATE COMMITTEE"}
                </AdminButton>
              )}
            </div>
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}

/* ── Tabs ───────────────────────────────────────────────────── */

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
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
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
      </div>

      <div className="flex flex-col" style={{ gap: 14 }}>
        <SectionLabel>Visibility</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
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
  onChange: React.Dispatch<React.SetStateAction<Draft | null>>;
}) {
  function rows<K extends "responsibilities" | "projects" | "facts">(key: K, next: Draft[K]) {
    onChange((d) => (d ? { ...d, [key]: next } : d));
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
  onChange: React.Dispatch<React.SetStateAction<Draft | null>>;
}) {
  const { c } = useDS();
  const positions = TRACK_POSITIONS[draft.track];
  const base = positions[positions.length - 1];

  const set = (next: DraftMember[]) => onChange((d) => (d ? { ...d, members: next } : d));

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
        backgroundColor: c.surface,
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

  // Typing moves the panel straight into its searching (or cleared) state.
  // Adjusted during render: as effect work it showed the previous query's
  // results for a frame, so a cleared box briefly still listed people.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setError(null);
    if (query.trim()) {
      setSearching(true);
    } else {
      setResults([]);
      setSearching(false);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) return;

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
            backgroundColor: c.surface,
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
