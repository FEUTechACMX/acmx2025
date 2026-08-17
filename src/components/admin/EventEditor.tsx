"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, font } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminButton, SectionLabel } from "./AdminShell";
import Icon from "./icons";

type Registration = {
  id: string;
  fullName: string;
  studentNumber: string;
  schoolEmail: string;
  role: string;
  attendance: { timeIn: string; timeOut: string | null } | null;
};

/**
 * The walk-in sheet. Somebody turns up at the door who never registered, so an
 * officer registers them and checks them in as one action.
 *
 * Membership is deliberately *not* a field here. The registration endpoint
 * decides MEMBER vs NON_MEMBER by matching the student number and school email
 * against real accounts, so an officer cannot promote a walk-in by ticking a
 * box — they can only describe who turned up.
 */
type WalkIn = {
  studentNumber: string;
  fullName: string;
  schoolEmail: string;
  contactNumber: string;
  facebookLink: string;
  yearLevel: string;
  section: string;
  professor: string;
  degreeProgram: string;
};

const EMPTY_WALK_IN: WalkIn = {
  studentNumber: "",
  fullName: "",
  schoolEmail: "",
  contactNumber: "",
  facebookLink: "",
  yearLevel: "",
  section: "",
  professor: "",
  degreeProgram: "",
};

type Form = {
  name: string;
  typeStr: string;
  venue: string;
  startDate: string;
  overview: string;
  mainObjective: string;
  specificObjectivesStr: string;
  targetParticipants: string;
  registrationFees: string;
  statusOverride: string; // "", UPCOMING, ONGOING, FINISHED
  image: string | null;
  status: string;
};

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const titleCase = (s: string) => (s ? s[0] + s.slice(1).toLowerCase() : "");

/** Same rule the events list uses: an override wins, otherwise the dates decide. */
function deriveStatus(override: string | null, start?: string, end?: string): string {
  if (override) return override;
  if (!start || !end) return "";
  const now = Date.now();
  if (now < new Date(start).getTime()) return "UPCOMING";
  if (now > new Date(end).getTime()) return "FINISHED";
  return "ONGOING";
}

/**
 * Admin → Events → one event.
 *
 * Editing an event means holding its details, its cover and its attendance
 * sheet at once, and the sheet is a list that grows to hundreds of rows. That
 * never fitted in a column beside the table, so an event opens as its own page:
 * details on the left, cover and attendance on the right.
 */
export default function EventEditor({ user, eventId }: { user: safeUser; eventId: string }) {
  const { c } = useDS();
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regQuery, setRegQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [walkIn, setWalkIn] = useState<WalkIn>(EMPTY_WALK_IN);
  const [walkInBusy, setWalkInBusy] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [walkInMsg, setWalkInMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [ev, rg] = await Promise.all([
        fetch(`/api/events/${eventId}`).then((r) => r.json()),
        fetch(`/api/events/${eventId}/registrations`).then((r) => r.json()),
      ]);

      if (ev?.error) {
        setError(ev.error);
      } else {
        setForm({
          name: ev.name ?? "",
          typeStr: (ev.type ?? []).join(", "),
          venue: ev.venue ?? "",
          startDate: toLocalInput(ev.startDate),
          overview: ev.overview ?? "",
          mainObjective: ev.mainObjective ?? "",
          specificObjectivesStr: (ev.specificObjectives ?? []).join("\n"),
          targetParticipants: ev.targetParticipants ?? "",
          registrationFees: ev.registrationFees ?? "",
          statusOverride: ev.statusOverride ?? "",
          image: ev.image ?? ev.cardImage ?? null,
          status: deriveStatus(ev.statusOverride ?? null, ev.startDate, ev.endDate),
        });
      }
      setRegs(rg?.registrations ?? []);
    } catch {
      setError("Couldn't load this event.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/events/${eventId}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? res.json() : null;
  };

  const saveDetails = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const ok = await patch({
      name: form.name,
      venue: form.venue,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      type: form.typeStr.split(",").map((s) => s.trim()).filter(Boolean),
      overview: form.overview,
      mainObjective: form.mainObjective,
      specificObjectives: form.specificObjectivesStr.split("\n").map((s) => s.trim()).filter(Boolean),
      targetParticipants: form.targetParticipants,
      registrationFees: form.registrationFees,
      statusOverride: form.statusOverride || null,
    });
    setSaving(false);
    if (ok) {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      // Re-read: the status badge follows the dates, so it can change as a
      // side effect of the very edit that was just saved.
      void load();
    } else {
      setError("Couldn't save this event.");
    }
  };

  const onPickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    const fd = new FormData();
    fd.append("bucket", "events");
    fd.append("files", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd }).then((r) => r.json());
    const url = up?.urls?.[0];
    if (url) {
      await patch({ image: url });
      setForm({ ...form, image: url });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCover = async () => {
    if (!form) return;
    await patch({ image: null });
    setForm({ ...form, image: null });
  };

  const checkIn = async (studentNumber: string) => {
    const res = await fetch(`/api/events/${eventId}/attendance/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentNumber, action: "in" }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      setRegs((prev) =>
        prev.map((r) =>
          r.studentNumber === studentNumber ? { ...r, attendance: { timeIn: now, timeOut: null } } : r
        )
      );
    }
  };

  /**
   * Pull an existing account into the walk-in form. A hit means they're a
   * member and we can stop retyping their details; a miss is not an error —
   * it just means the officer fills the form in by hand for a non-member.
   */
  const lookupMember = async () => {
    const q = walkIn.studentNumber.trim();
    if (!q) return;
    setLookupBusy(true);
    setWalkInMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setWalkIn((w) => ({
          ...w,
          studentNumber: data.studentNumber || w.studentNumber,
          fullName: data.fullName || "",
          schoolEmail: data.schoolEmail || "",
          contactNumber: data.contactNumber || "",
          facebookLink: data.facebookLink || "",
          yearLevel: data.yearLevel || "",
          degreeProgram: data.degreeProgram || "",
        }));
        setWalkInMsg({ ok: true, text: "Member found — details filled in." });
      } else if (res.status === 404) {
        setWalkInMsg({
          ok: false,
          text: "No account with that student number. Fill the rest in by hand to register them as a non-member.",
        });
      } else {
        setWalkInMsg({ ok: false, text: data.error || "Lookup failed." });
      }
    } catch {
      setWalkInMsg({ ok: false, text: "Lookup failed." });
    } finally {
      setLookupBusy(false);
    }
  };

  /**
   * Register the walk-in, then check them in. The check-in is reported
   * separately because the registration is the part that must not be lost — if
   * attendance fails, the officer can still tick them off in the list above.
   */
  const submitWalkIn = async () => {
    const missing = (
      [
        ["studentNumber", "student number"],
        ["fullName", "full name"],
        ["schoolEmail", "school email"],
        ["yearLevel", "year level"],
      ] as const
    ).find(([key]) => !walkIn[key].trim());

    if (missing) {
      setWalkInMsg({ ok: false, text: `A ${missing[1]} is required.` });
      return;
    }

    setWalkInBusy(true);
    setWalkInMsg(null);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...walkIn, eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWalkInMsg({ ok: false, text: data.error || "Registration failed." });
        return;
      }

      const att = await fetch(`/api/events/${eventId}/attendance/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber: walkIn.studentNumber.trim(), action: "in" }),
      });

      setWalkIn(EMPTY_WALK_IN);
      setWalkInMsg(
        att.ok
          ? { ok: true, text: "Registered and checked in." }
          : { ok: false, text: "Registered — but the check-in didn't record. Tick them off in the list above." }
      );
      void load();
    } catch {
      setWalkInMsg({ ok: false, text: "Registration failed." });
    } finally {
      setWalkInBusy(false);
    }
  };

  const exportCsv = () => {
    const rows = [["Full Name", "Student No.", "Email", "Role", "Attended"]].concat(
      regs.map((r) => [r.fullName, r.studentNumber, r.schoolEmail, r.role, r.attendance ? "Yes" : "No"])
    );
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `registrations-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const shownRegs = useMemo(() => {
    const q = regQuery.trim().toLowerCase();
    if (!q) return regs;
    return regs.filter((r) =>
      `${r.fullName} ${r.studentNumber} ${r.schoolEmail}`.toLowerCase().includes(q)
    );
  }, [regs, regQuery]);

  const checkedIn = regs.filter((r) => r.attendance).length;
  const set = (patchForm: Partial<Form>) => setForm((f) => (f ? { ...f, ...patchForm } : f));

  return (
    <AdminShell user={user} breadcrumb={form?.name || "Event"}>
      <AdminContent>
        <div className="flex flex-col" style={{ gap: 18 }}>
          <Link
            href="/admin/events"
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
            All events
          </Link>

          <div className="flex flex-wrap items-end justify-between" style={{ gap: 16 }}>
            <div className="flex flex-col min-w-0" style={{ gap: 9, maxWidth: 640 }}>
              <span style={{ ...t.label, color: c.accent }}>EDIT EVENT</span>
              <h1 style={{ ...t.title, fontSize: "clamp(1.5rem, 2.6vw, 2rem)", color: c.text }}>
                {form?.name || (loading ? "Loading…" : "Event")}
              </h1>
              {form && (
                <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
                  {form.status && (
                    <span
                      style={{
                        ...t.label,
                        fontSize: 9,
                        color: c.accent,
                        padding: "4px 9px",
                        border: `1px solid ${c.accent}`,
                      }}
                    >
                      {titleCase(form.status)}
                    </span>
                  )}
                  <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
                    {regs.length} registered · {checkedIn} checked in
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center" style={{ gap: 12 }}>
              {savedFlash && <span style={{ ...t.label, fontSize: 9, color: c.accent }}>SAVED ✓</span>}
              <AdminButton onClick={() => void saveDetails()} disabled={saving || !form} icon="check">
                {saving ? "SAVING…" : "SAVE CHANGES"}
              </AdminButton>
            </div>
          </div>

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
        </div>

        {loading && <span style={{ ...t.bodySmall, color: c.muted }}>Loading this event…</span>}

        {form && (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 26rem), 1fr))" }}
          >
            {/* Details */}
            <div
              className="flex flex-col"
              style={{
                gap: 18,
                padding: "22px 20px",
                backgroundColor: c.panel,
                border: `1px solid ${c.rule}`,
                alignSelf: "start",
              }}
            >
              <SectionLabel>Details</SectionLabel>

              <EditField label="TITLE" value={form.name} onChange={(v) => set({ name: v })} />
              <EditField
                label="TYPE (comma-separated)"
                value={form.typeStr}
                onChange={(v) => set({ typeStr: v })}
              />
              <EditField
                label="DATE & TIME"
                type="datetime-local"
                value={form.startDate}
                onChange={(v) => set({ startDate: v })}
              />
              <EditField label="VENUE" value={form.venue} onChange={(v) => set({ venue: v })} />

              <div className="flex flex-col" style={{ gap: 7 }}>
                <span style={{ ...t.label, fontSize: 10, color: c.faint }}>STATUS</span>
                <select
                  value={form.statusOverride}
                  onChange={(e) => set({ statusOverride: e.target.value })}
                  style={{
                    ...t.bodySmall,
                    padding: "11px 13px",
                    background: "transparent",
                    color: c.text,
                    border: `1px solid ${c.ruleStrong}`,
                    outline: "none",
                  }}
                >
                  <option value="">Auto (from dates)</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="FINISHED">Finished</option>
                </select>
              </div>

              <SectionLabel>Programme</SectionLabel>
              <EditField
                label="OVERVIEW"
                value={form.overview}
                onChange={(v) => set({ overview: v })}
                multiline
              />
              <EditField
                label="MAIN OBJECTIVE"
                value={form.mainObjective}
                onChange={(v) => set({ mainObjective: v })}
                multiline
              />
              <EditField
                label="SPECIFIC OBJECTIVES (one per line)"
                value={form.specificObjectivesStr}
                onChange={(v) => set({ specificObjectivesStr: v })}
                multiline
              />
              <EditField
                label="TARGET PARTICIPANTS"
                value={form.targetParticipants}
                onChange={(v) => set({ targetParticipants: v })}
              />
              <EditField
                label="REGISTRATION FEES"
                value={form.registrationFees}
                onChange={(v) => set({ registrationFees: v })}
              />
            </div>

            {/* Cover + attendance */}
            <div className="flex flex-col" style={{ gap: 24, alignSelf: "start" }}>
              <div
                className="flex flex-col"
                style={{
                  gap: 16,
                  padding: "22px 20px",
                  backgroundColor: c.panel,
                  border: `1px solid ${c.rule}`,
                }}
              >
                <SectionLabel>Cover image</SectionLabel>
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    gap: 8,
                    height: 200,
                    backgroundColor: "#1e1d22",
                    border: `1px solid ${c.rule}`,
                    backgroundImage: form.image ? `url(${form.image})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!form.image && (
                    <>
                      <Icon name="image" size={26} style={{ color: c.faint }} />
                      <span style={{ ...t.label, fontSize: 10, color: c.faint }}>NO COVER IMAGE</span>
                    </>
                  )}
                  <div className="flex" style={{ gap: 8 }}>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center cursor-pointer"
                      style={{
                        ...t.label,
                        fontSize: 10,
                        gap: 6,
                        padding: "6px 10px",
                        color: c.text,
                        background: "rgba(0,0,0,0.5)",
                        border: `1px solid ${c.ruleStrong}`,
                      }}
                    >
                      <Icon name="upload" size={12} /> REPLACE
                    </button>
                    {form.image && (
                      <button
                        onClick={() => void removeCover()}
                        className="flex items-center cursor-pointer"
                        style={{
                          ...t.label,
                          fontSize: 10,
                          gap: 6,
                          padding: "6px 10px",
                          color: c.accent,
                          background: "rgba(0,0,0,0.5)",
                          border: `1px solid ${c.ruleStrong}`,
                        }}
                      >
                        <Icon name="trash" size={12} /> REMOVE
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickCover} />
                </div>
              </div>

              <div
                className="flex flex-col"
                style={{
                  gap: 16,
                  padding: "22px 20px",
                  backgroundColor: c.panel,
                  border: `1px solid ${c.rule}`,
                }}
              >
                <SectionLabel>Registrations &amp; attendance</SectionLabel>

                <div className="flex" style={{ gap: 28 }}>
                  {([["REGISTERED", regs.length], ["CHECKED IN", checkedIn]] as const).map(([l, n]) => (
                    <div key={l} className="flex flex-col" style={{ gap: 5 }}>
                      <span style={{ fontFamily: font.display, fontSize: 26, fontWeight: 500, color: c.text }}>
                        {n}
                      </span>
                      <span style={{ ...t.label, fontSize: 9, color: c.faint }}>{l}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center"
                  style={{ gap: 9, padding: "0 11px", border: `1px solid ${c.ruleStrong}` }}
                >
                  <span style={{ color: c.faint, display: "flex" }}>
                    <Icon name="search" size={14} />
                  </span>
                  <input
                    value={regQuery}
                    onChange={(e) => setRegQuery(e.target.value)}
                    placeholder="Find an attendee…"
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
                </div>

                <div style={{ border: `1px solid ${c.rule}`, maxHeight: 460, overflowY: "auto" }}>
                  <div
                    className="flex items-center"
                    style={{ padding: "10px 14px", borderBottom: `1px solid ${c.rule}` }}
                  >
                    <span className="flex-1" style={{ ...t.label, fontSize: 9, color: c.faint }}>
                      ATTENDEE
                    </span>
                    <span style={{ width: 44, textAlign: "center", ...t.label, fontSize: 9, color: c.faint }}>
                      REG
                    </span>
                    <span style={{ width: 44, textAlign: "center", ...t.label, fontSize: 9, color: c.faint }}>
                      ATT
                    </span>
                  </div>

                  {regs.length === 0 && (
                    <div style={{ padding: 14 }}>
                      <span style={{ ...t.bodySmall, color: c.muted }}>No registrations yet.</span>
                    </div>
                  )}
                  {regs.length > 0 && shownRegs.length === 0 && (
                    <div style={{ padding: 14 }}>
                      <span style={{ ...t.bodySmall, color: c.muted }}>
                        Nobody matches “{regQuery.trim()}”.
                      </span>
                    </div>
                  )}

                  {shownRegs.map((r, i) => {
                    const attended = !!r.attendance;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center"
                        style={{
                          padding: "10px 14px",
                          borderBottom: i < shownRegs.length - 1 ? `1px solid ${c.rule}` : "none",
                        }}
                      >
                        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                          <span
                            style={{
                              ...t.bodySmall,
                              fontWeight: 600,
                              color: c.text,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.fullName}
                          </span>
                          <span
                            style={{
                              ...t.mono,
                              color: c.faint,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {r.schoolEmail}
                          </span>
                        </div>
                        <div style={{ width: 44 }} className="flex justify-center">
                          <CheckBox on onClick={undefined} c={c} />
                        </div>
                        <div style={{ width: 44 }} className="flex justify-center">
                          <CheckBox
                            on={attended}
                            onClick={attended ? undefined : () => void checkIn(r.studentNumber)}
                            c={c}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between flex-wrap" style={{ gap: 10 }}>
                  <button
                    onClick={exportCsv}
                    className="flex items-center cursor-pointer"
                    style={{
                      ...t.label,
                      fontSize: 10,
                      gap: 6,
                      padding: "7px 11px",
                      color: c.text,
                      background: "none",
                      border: `1px solid ${c.ruleStrong}`,
                    }}
                  >
                    <Icon name="download" size={12} /> EXPORT CSV
                  </button>
                  <AdminButton variant="ghost" onClick={() => router.push("/admin/events")}>
                    BACK TO EVENTS
                  </AdminButton>
                </div>
              </div>

              <div
                className="flex flex-col"
                style={{
                  gap: 16,
                  padding: "22px 20px",
                  backgroundColor: c.panel,
                  border: `1px solid ${c.rule}`,
                }}
              >
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <SectionLabel>Walk-in registration</SectionLabel>
                  <span style={{ ...t.bodySmall, color: c.muted }}>
                    For someone at the door who never registered. Look up their student
                    number to fill this in, or type it out for a non-member. Saving
                    registers them and checks them in.
                  </span>
                </div>

                <div className="flex flex-col" style={{ gap: 7 }}>
                  <span style={{ ...t.label, fontSize: 10, color: c.faint }}>STUDENT NUMBER</span>
                  <div className="flex" style={{ gap: 9 }}>
                    <input
                      value={walkIn.studentNumber}
                      onChange={(e) => setWalkIn((w) => ({ ...w, studentNumber: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void lookupMember();
                        }
                      }}
                      placeholder="2023100123"
                      style={{
                        ...t.bodySmall,
                        flex: 1,
                        minWidth: 0,
                        padding: "11px 13px",
                        background: "transparent",
                        color: c.text,
                        border: `1px solid ${c.ruleStrong}`,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={() => void lookupMember()}
                      disabled={lookupBusy || !walkIn.studentNumber.trim()}
                      className="flex items-center cursor-pointer"
                      style={{
                        ...t.label,
                        fontSize: 10,
                        gap: 6,
                        padding: "0 13px",
                        color: c.text,
                        background: "none",
                        border: `1px solid ${c.ruleStrong}`,
                        opacity: lookupBusy || !walkIn.studentNumber.trim() ? 0.45 : 1,
                      }}
                    >
                      <Icon name="search" size={12} /> {lookupBusy ? "…" : "LOOK UP"}
                    </button>
                  </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                  <EditField
                    label="FULL NAME"
                    value={walkIn.fullName}
                    onChange={(v) => setWalkIn((w) => ({ ...w, fullName: v }))}
                  />
                  <EditField
                    label="SCHOOL EMAIL"
                    value={walkIn.schoolEmail}
                    onChange={(v) => setWalkIn((w) => ({ ...w, schoolEmail: v }))}
                  />
                  <EditField
                    label="YEAR LEVEL"
                    type="number"
                    value={walkIn.yearLevel}
                    onChange={(v) => setWalkIn((w) => ({ ...w, yearLevel: v }))}
                  />
                  <EditField
                    label="DEGREE PROGRAM"
                    value={walkIn.degreeProgram}
                    onChange={(v) => setWalkIn((w) => ({ ...w, degreeProgram: v }))}
                  />
                  <EditField
                    label="SECTION"
                    value={walkIn.section}
                    onChange={(v) => setWalkIn((w) => ({ ...w, section: v }))}
                  />
                  <EditField
                    label="PROFESSOR"
                    value={walkIn.professor}
                    onChange={(v) => setWalkIn((w) => ({ ...w, professor: v }))}
                  />
                  <EditField
                    label="CONTACT NUMBER"
                    value={walkIn.contactNumber}
                    onChange={(v) => setWalkIn((w) => ({ ...w, contactNumber: v }))}
                  />
                  <EditField
                    label="FACEBOOK LINK"
                    value={walkIn.facebookLink}
                    onChange={(v) => setWalkIn((w) => ({ ...w, facebookLink: v }))}
                  />
                </div>

                {walkInMsg && (
                  <span style={{ ...t.bodySmall, color: walkInMsg.ok ? c.accent : "#e5484d" }}>
                    {walkInMsg.text}
                  </span>
                )}

                <div className="flex items-center" style={{ gap: 10 }}>
                  <AdminButton icon="check" onClick={() => void submitWalkIn()} disabled={walkInBusy}>
                    {walkInBusy ? "SAVING…" : "REGISTER & CHECK IN"}
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    onClick={() => {
                      setWalkIn(EMPTY_WALK_IN);
                      setWalkInMsg(null);
                    }}
                  >
                    CLEAR
                  </AdminButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}

function CheckBox({
  on,
  onClick,
  c,
}: {
  on: boolean;
  onClick?: () => void;
  c: ReturnType<typeof useDS>["c"];
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center justify-center"
      style={{
        width: 18,
        height: 18,
        backgroundColor: on ? c.accent : "transparent",
        border: `1px solid ${on ? c.accent : c.ruleStrong}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {on && <Icon name="check" size={12} style={{ color: "#fff" }} />}
    </button>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const { c } = useDS();
  const base: React.CSSProperties = {
    ...t.bodySmall,
    width: "100%",
    padding: "11px 13px",
    background: "transparent",
    color: c.text,
    border: `1px solid ${c.ruleStrong}`,
    outline: "none",
  };
  return (
    <div className="flex flex-col" style={{ gap: 7 }}>
      <span style={{ ...t.label, fontSize: 10, color: c.faint }}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          style={{ ...base, resize: "vertical" }}
        />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </div>
  );
}
