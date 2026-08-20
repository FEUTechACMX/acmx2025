"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { safeUser } from "@/types/auth";
import { USER_ROLES, roleLabel, isSecretariatOrAbove } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, font } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton } from "./AdminShell";
import Icon from "./icons";

type Member = { studentId: string; name: string; email: string; role: string; joined: string };

function rolePillColors(role: string, c: ReturnType<typeof useDS>["c"]) {
  if (role === "ADMIN") return { bg: c.accent, fg: "#ffffff", border: c.accent };
  if (role === "MEMBER") return { bg: "transparent", fg: c.muted, border: c.rule };
  return { bg: "transparent", fg: c.accent, border: c.accent };
}

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

export default function PeopleRoles({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  /** "" means every role. Narrows the roll to one role at a time. */
  const [listRole, setListRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [resetNote, setResetNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * Set when the roster outgrew the endpoint's cap. Shown rather than swallowed:
   * a list that is quietly incomplete is worse than a slow one (§11.4).
   */
  const [truncated, setTruncated] = useState<{ shown: number; total: number } | null>(null);

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setMembers(d.users);
        setCounts(d.counts);
        setTruncated(d.truncated ? { shown: d.users.length, total: d.total } : null);
        setSelected((prev) => prev ?? d.users[0]?.studentId ?? null);
      })
      .catch(() => {});
  };
  useEffect(load, []);

  const selectedMember = members.find((m) => m.studentId === selected) ?? null;

  // Picking a different member resets the pending role and clears any error.
  // Adjusted during render rather than in an effect, which would show the
  // previous member's role for one frame after the selection changed.
  const memberRole = selectedMember?.role ?? null;
  const [prevSelection, setPrevSelection] = useState<[string | null, string | null]>([
    selected,
    memberRole,
  ]);
  if (prevSelection[0] !== selected || prevSelection[1] !== memberRole) {
    setPrevSelection([selected, memberRole]);
    setPendingRole(memberRole);
    setError(null);
  }

  /**
   * The roll runs to four figures, so the list is unusable without this. Each
   * term has to match somewhere, which lets "cruz 2023" narrow rather than
   * widen — the same rule the committee roster picker searches by.
   */
  const shown = useMemo(() => {
    const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return members.filter((m) => {
      if (listRole && m.role !== listRole) return false;
      if (terms.length === 0) return true;
      const haystack = `${m.name} ${m.email} ${m.studentId} ${roleLabel(m.role)}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [members, search, listRole]);

  /**
   * The role chips. Officer roles are a handful of people among a four-figure
   * roll, so a role with nobody in it is left off the row rather than shown as
   * a dead chip — except the one currently picked, which has to stay clickable
   * to get back out of.
   */
  const roleTabs = useMemo(() => {
    const tally = members.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {});
    return USER_ROLES.filter((r) => (tally[r] ?? 0) > 0 || r === listRole).map((r) => ({
      role: r as string,
      count: tally[r] ?? 0,
    }));
  }, [members, listRole]);

  const filteredRoles = useMemo(
    () => USER_ROLES.filter((r) => roleLabel(r).toLowerCase().includes(roleFilter.toLowerCase()) || r.toLowerCase().includes(roleFilter.toLowerCase())),
    [roleFilter]
  );

  const assign = async () => {
    if (!selectedMember || !pendingRole || pendingRole === selectedMember.role) return;
    setSaving(true);
    setError(null);
    setResetNote(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedMember.studentId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pendingRole }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Failed to assign role");
      } else {
        setMembers((prev) => prev.map((m) => (m.studentId === selectedMember.studentId ? { ...m, role: pendingRole } : m)));
        load();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const resendAccountLink = async () => {
    if (!selectedMember) return;
    setResending(true);
    setError(null);
    setResetNote(null);
    try {
      const res = await fetch(`/api/admin/users/${selectedMember.studentId}/account-reset`, {
        method: "POST",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Could not re-send the account email.");
      } else {
        setResetNote(d.message || "Account email sent.");
      }
    } catch {
      setError("Network error");
    } finally {
      setResending(false);
    }
  };

  const dirty = !!selectedMember && pendingRole !== selectedMember.role;
  const canResendAccount = isSecretariatOrAbove(user?.role);

  return (
    <AdminShell
      user={user}
      breadcrumb="People & Roles"
      searchPlaceholder="Search members…"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${truncated ? truncated.total : members.length} MEMBERS · ${USER_ROLES.length} ROLES`}
          title="People & Roles"
          subtitle="Assign officer roles to members. Pick a person, choose a role — new roles can be added in the Prisma schema anytime."
        />

        {truncated && (
          <div
            style={{
              ...t.bodySmall,
              padding: "12px 14px",
              color: c.text,
              backgroundColor: c.dangerWash,
              border: `1px solid ${c.danger}`,
            }}
          >
            Showing the first {truncated.shown.toLocaleString()} of{" "}
            {truncated.total.toLocaleString()} members. Search only covers the
            loaded set — the roster has outgrown this page and needs proper paging.
          </div>
        )}

        {/* Filter the roll by role */}
        <div className="flex flex-col" style={{ gap: 10 }}>
          <span style={{ ...t.label, fontSize: 10, color: c.faint }}>FILTER BY ROLE</span>
          <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
            <RoleChip on={listRole === ""} count={members.length} onClick={() => setListRole("")}>
              All roles
            </RoleChip>
            {roleTabs.map((r) => (
              <RoleChip
                key={r.role}
                on={listRole === r.role}
                count={r.count}
                onClick={() => setListRole(listRole === r.role ? "" : r.role)}
              >
                {roleLabel(r.role)}
              </RoleChip>
            ))}
          </div>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)" }}>
          {/* Members table */}
          <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}`, alignSelf: "start" }}>
            <div className="flex items-center" style={{ padding: "14px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <span className="flex-1" style={{ ...t.label, fontSize: 10, color: c.faint }}>
                MEMBER
                {(search.trim() || listRole) && ` · ${shown.length} OF ${members.length}`}
              </span>
              <span style={{ width: 180, ...t.label, fontSize: 10, color: c.faint }}>CURRENT ROLE</span>
              <span style={{ width: 90, ...t.label, fontSize: 10, color: c.faint }}>JOINED</span>
            </div>
            {shown.map((m, i) => {
              const sel = m.studentId === selected;
              const pc = rolePillColors(m.role, c);
              return (
                <button
                  key={m.studentId}
                  onClick={() => setSelected(m.studentId)}
                  className="flex items-center w-full text-left cursor-pointer"
                  style={{
                    padding: "13px 20px",
                    background: sel ? c.accentWash : "transparent",
                    borderLeft: `2px solid ${sel ? c.accent : "transparent"}`,
                    borderBottom: i < shown.length - 1 ? `1px solid ${c.rule}` : "none",
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0" style={{ gap: 12 }}>
                    <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, backgroundColor: c.accentWash, border: `1px solid ${c.rule}` }}>
                      <span style={{ fontFamily: font.display, fontSize: 12, fontWeight: 700, color: c.accent }}>{initialsOf(m.name)}</span>
                    </div>
                    <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
                      <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      <span style={{ ...t.mono, color: c.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</span>
                    </div>
                  </div>
                  <div style={{ width: 180 }}>
                    <span className="inline-flex items-center" style={{ ...t.label, letterSpacing: "0.04em", gap: 8, padding: "7px 11px", color: pc.fg, backgroundColor: pc.bg, border: `1px solid ${pc.border}` }}>
                      {roleLabel(m.role)}
                    </span>
                  </div>
                  <span style={{ width: 90, ...t.label, fontSize: 10, color: c.muted }}>
                    {new Date(m.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                  </span>
                </button>
              );
            })}
            {members.length === 0 && (
              <div style={{ padding: "24px 20px" }}><span style={{ ...t.bodySmall, color: c.muted }}>Loading members…</span></div>
            )}
            {members.length > 0 && shown.length === 0 && (
              <div style={{ padding: "24px 20px" }}>
                <span style={{ ...t.bodySmall, color: c.muted }}>
                  {listRole && !search.trim()
                    ? `Nobody holds ${roleLabel(listRole)} right now.`
                    : `No member matches “${search.trim()}”${listRole ? ` in ${roleLabel(listRole)}` : ""}. Search by name, email, student number or role.`}
                </span>
              </div>
            )}
          </div>

          {/* Assign panel */}
          <div className="flex flex-col" style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}`, alignSelf: "start", position: "sticky", top: 0 }}>
            <div className="flex items-center justify-between" style={{ padding: "15px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <span style={{ ...t.label, color: c.faint }}>ASSIGN ROLE</span>
            </div>

            {!selectedMember ? (
              <div style={{ padding: 20 }}><span style={{ ...t.bodySmall, color: c.muted }}>Select a member to assign a role.</span></div>
            ) : (
              <div className="flex flex-col" style={{ padding: 20, gap: 16 }}>
                {/* Member card */}
                <div className="flex items-center" style={{ gap: 12, padding: 14, backgroundColor: c.accentWash, borderLeft: `2px solid ${c.accent}` }}>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: c.surface, border: `1px solid ${c.rule}` }}>
                    <span style={{ fontFamily: font.display, fontSize: 13, fontWeight: 700, color: c.accent }}>{initialsOf(selectedMember.name)}</span>
                  </div>
                  <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
                    <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text }}>{selectedMember.name}</span>
                    <span style={{ ...t.mono, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      currently {roleLabel(selectedMember.role)}
                    </span>
                  </div>
                </div>

                {/* Role search */}
                <div className="flex items-center" style={{ gap: 8, padding: "10px 13px", border: `1px solid ${c.ruleStrong}` }}>
                  <Icon name="search" size={14} style={{ color: c.faint }} />
                  <input
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    placeholder="Find a role…"
                    style={{ ...t.bodySmall, flex: 1, background: "transparent", border: "none", outline: "none", color: c.text }}
                  />
                </div>

                {/* Role list */}
                <div style={{ border: `1px solid ${c.rule}`, maxHeight: 320, overflowY: "auto" }}>
                  {filteredRoles.map((r, i) => {
                    const pick = pendingRole === r;
                    const current = selectedMember.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setPendingRole(r)}
                        className="flex items-center justify-between w-full cursor-pointer"
                        style={{
                          gap: 10,
                          padding: "11px 14px",
                          background: pick ? c.accentWash : "transparent",
                          borderLeft: `2px solid ${pick ? c.accent : "transparent"}`,
                          borderBottom: i < filteredRoles.length - 1 ? `1px solid ${c.rule}` : "none",
                        }}
                      >
                        <div className="flex items-center" style={{ gap: 11 }}>
                          <span
                            className="flex items-center justify-center shrink-0"
                            style={{ width: 15, height: 15, borderRadius: "50%", border: `1px solid ${pick ? c.accent : c.ruleStrong}`, backgroundColor: pick ? c.accent : "transparent" }}
                          >
                            {pick && <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#fff" }} />}
                          </span>
                          <span style={{ ...t.label, letterSpacing: "0.04em", color: pick ? c.accent : c.text }}>{roleLabel(r)}</span>
                        </div>
                        <div className="flex items-center" style={{ gap: 8 }}>
                          {current && (
                            <span style={{ ...t.label, fontSize: 8, color: c.muted, padding: "2px 7px", border: `1px solid ${c.rule}` }}>CURRENT</span>
                          )}
                          <span style={{ ...t.label, fontSize: 10, color: c.faint }}>{counts[r] ?? 0}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && <span style={{ ...t.bodySmall, color: c.accent }}>{error}</span>}

                <div className="flex" style={{ gap: 10 }}>
                  <AdminButton variant="ghost" onClick={() => setPendingRole(selectedMember.role)} disabled={!dirty || saving}>CANCEL</AdminButton>
                  <div className="flex-1">
                    <AdminButton onClick={assign} disabled={!dirty || saving} block>
                      {saving ? "ASSIGNING…" : dirty ? `ASSIGN ${roleLabel(pendingRole || "").toUpperCase()}` : "NO CHANGES"}
                    </AdminButton>
                  </div>
                </div>

                {canResendAccount && (
                  <div
                    className="flex flex-col"
                    style={{ gap: 10, paddingTop: 14, borderTop: `1px solid ${c.rule}` }}
                  >
                    <span style={{ ...t.label, color: c.faint }}>ACCOUNT SECURITY</span>
                    <span style={{ ...t.bodySmall, color: c.muted }}>
                      Re-send a claim or reset link to this member&apos;s school email on file.
                    </span>
                    {resetNote && (
                      <span style={{ ...t.bodySmall, color: c.text }}>{resetNote}</span>
                    )}
                    <AdminButton
                      variant="ghost"
                      onClick={resendAccountLink}
                      disabled={resending}
                      block
                    >
                      {resending ? "SENDING…" : "RE-SEND ACCOUNT CLAIM / RESET"}
                    </AdminButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  );
}

/** One role in the filter row, with how many people hold it. */
function RoleChip({
  on,
  count,
  onClick,
  children,
}: {
  on: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className="flex items-center cursor-pointer"
      style={{
        ...t.label,
        fontSize: 10,
        gap: 8,
        padding: "8px 12px",
        color: on ? "#ffffff" : c.muted,
        backgroundColor: on ? c.accent : "transparent",
        border: `1px solid ${on ? c.accent : c.rule}`,
      }}
    >
      {children}
      <span style={{ ...t.mono, fontSize: 10, color: on ? "#ffffff" : c.faint }}>{count}</span>
    </button>
  );
}
