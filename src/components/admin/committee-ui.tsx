"use client";

import React from "react";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import Icon, { type IconName } from "./icons";
import { SectionLabel } from "./AdminShell";
import {
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
} from "@/types/committee";

/**
 * Shared vocabulary between Admin → Committees' list and its editor page.
 *
 * The two used to be one component with the editor in a drawer. Now the editor
 * is its own route, so the draft shape and the small primitives both screens
 * draw with live here instead of being duplicated on either side.
 */

/* ── Draft ──────────────────────────────────────────────────── */

/** A roster row in the editor. Every row added here comes from an account. */
export type DraftMember = {
  userId: string | null;
  name: string;
  studentId: string | null;
  userRole: string | null;
  roleLabel: string;
  position: CommitteeMemberRole;
  bio: string;
};

/** The editor's working copy. Everything is a string until it's saved. */
export type Draft = {
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

export const BLANK_DRAFT: Draft = {
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

export function toDraft(x: CommitteeDTO): Draft {
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

/** The payload the API expects. Shared by create and save. */
export function draftPayload(d: Draft) {
  return {
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
}

/**
 * Mirrors the server's reconciliation when the track changes, so the roster the
 * admin is looking at is the roster that will be saved. A position the incoming
 * track doesn't have — and a second holder of a single-seat one — becomes that
 * track's rank-and-file seat.
 */
export function refile(members: DraftMember[], track: CommitteeTrack): DraftMember[] {
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

/* ── Row helpers ────────────────────────────────────────────── */

export function patchRow<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export function dropRow<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function moveRow<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(index, 1)[0]);
  return next;
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

export function EditorField({
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

export function SearchInput({
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
export function Avatar({ name }: { name: string }) {
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
export function ChoiceRow({
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

export function MiniChip({
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

export function IconBtn({
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

export function Pill({
  tone,
  label,
}: {
  tone: "accent" | "positive" | "quiet" | "warn";
  label: string;
}) {
  const { c } = useDS();
  const tones = {
    accent: { fg: c.accent, bg: c.accentWash, edge: c.accent },
    positive: { fg: c.positive, bg: c.positiveWash, edge: c.positive },
    warn: { fg: c.muted, bg: "transparent", edge: c.ruleStrong },
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

export function Count({ label, value }: { label: string; value: number }) {
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

export function RowGroup({
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

export function RowShell({
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
