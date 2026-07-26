"use client";

import React, { useEffect, useRef, useState } from "react";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, font } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton } from "./AdminShell";
import Icon from "./icons";

type EventRow = {
  eventId: string;
  name: string;
  type: string[];
  startDate: string;
  image: string | null;
  registered: number;
  attended: number;
  status: "UPCOMING" | "ONGOING" | "FINISHED";
};

type Registration = {
  id: string;
  fullName: string;
  studentNumber: string;
  schoolEmail: string;
  role: string;
  attendance: { timeIn: string; timeOut: string | null } | null;
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
};

const toLocalInput = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function statusColor(status: string, c: ReturnType<typeof useDS>["c"]) {
  if (status === "UPCOMING" || status === "ONGOING") return c.accent;
  if (status === "FINISHED") return c.muted;
  return c.faint;
}

export default function EventsManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadEvents = () => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setEvents(d.events);
        setSelected((prev) => prev ?? d.events[0]?.eventId ?? null);
      })
      .catch(() => {});
  };
  useEffect(loadEvents, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingDetail(true);
    setShowMore(false);
    Promise.all([
      fetch(`/api/events/${selected}`).then((r) => r.json()),
      fetch(`/api/events/${selected}/registrations`).then((r) => r.json()),
    ])
      .then(([ev, rg]) => {
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
        });
        setRegs(rg.registrations ?? []);
      })
      .finally(() => setLoadingDetail(false));
  }, [selected]);

  const patch = async (body: Record<string, unknown>) => {
    if (!selected) return null;
    const res = await fetch(`/api/events/${selected}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok ? res.json() : null;
  };

  const saveDetails = async () => {
    if (!form) return;
    setSaving(true);
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
      loadEvents();
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
      loadEvents();
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeCover = async () => {
    if (!form) return;
    await patch({ image: null });
    setForm({ ...form, image: null });
    loadEvents();
  };

  const checkIn = async (studentNumber: string) => {
    if (!selected) return;
    const res = await fetch(`/api/events/${selected}/attendance/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentNumber, action: "in" }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      setRegs((prev) => prev.map((r) => (r.studentNumber === studentNumber ? { ...r, attendance: { timeIn: now, timeOut: null } } : r)));
      loadEvents();
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
    a.download = `registrations-${selected}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const checkedIn = regs.filter((r) => r.attendance).length;
  const selEvent = events.find((e) => e.eventId === selected);

  const set = (patchForm: Partial<Form>) => setForm((f) => (f ? { ...f, ...patchForm } : f));

  return (
    <AdminShell user={user} breadcrumb="Events" searchPlaceholder="Search events…">
      <AdminContent>
        <AdminPageHeader
          eyebrow={`MANAGE · ${events.length} EVENTS`}
          title="Events"
          subtitle="Full edit access — details, cover image, registrations and attendance."
          actions={<AdminButton icon="plus" onClick={() => alert("Event creation lives in the existing create flow.")}>NEW EVENT</AdminButton>}
        />

        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 480px)" }}>
          {/* Table */}
          <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}`, alignSelf: "start" }}>
            <div className="flex items-center" style={{ padding: "14px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <span className="flex-1" style={{ ...t.label, fontSize: 10, color: c.faint }}>EVENT</span>
              <span style={{ width: 70, ...t.label, fontSize: 10, color: c.faint }}>REG.</span>
              <span style={{ width: 80, ...t.label, fontSize: 10, color: c.faint }}>ATT.</span>
              <span style={{ width: 100, ...t.label, fontSize: 10, color: c.faint }}>STATUS</span>
            </div>
            {events.map((e, i) => {
              const sel = e.eventId === selected;
              const sc = statusColor(e.status, c);
              return (
                <button
                  key={e.eventId}
                  onClick={() => setSelected(e.eventId)}
                  className="flex items-center w-full text-left cursor-pointer"
                  style={{
                    padding: "14px 20px",
                    background: sel ? c.accentWash : "transparent",
                    borderLeft: `2px solid ${sel ? c.accent : "transparent"}`,
                    borderBottom: i < events.length - 1 ? `1px solid ${c.rule}` : "none",
                  }}
                >
                  <div className="flex flex-col flex-1 min-w-0" style={{ gap: 3 }}>
                    <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                    <span style={{ ...t.label, fontSize: 10, color: c.faint }}>
                      {new Date(e.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {e.type[0] ? ` · ${e.type[0]}` : ""}
                    </span>
                  </div>
                  <span style={{ width: 70, fontFamily: font.display, fontSize: 15, color: c.text }}>{e.registered}</span>
                  <span style={{ width: 80, fontFamily: font.display, fontSize: 15, color: e.attended ? c.text : c.faint }}>{e.attended || "—"}</span>
                  <span style={{ width: 100 }}>
                    <span style={{ ...t.label, fontSize: 10, color: sc, padding: "5px 10px", border: `1px solid ${sc}` }}>{e.status[0] + e.status.slice(1).toLowerCase()}</span>
                  </span>
                </button>
              );
            })}
            {events.length === 0 && <div style={{ padding: "24px 20px" }}><span style={{ ...t.bodySmall, color: c.muted }}>Loading events…</span></div>}
          </div>

          {/* Editor */}
          <div className="flex flex-col" style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}`, alignSelf: "start" }}>
            <div className="flex items-center justify-between" style={{ padding: "15px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <span style={{ ...t.label, color: c.faint }}>EDIT EVENT</span>
                {selEvent && <span style={{ ...t.label, fontSize: 9, color: c.accent, padding: "4px 9px", border: `1px solid ${c.accent}` }}>{selEvent.status[0] + selEvent.status.slice(1).toLowerCase()}</span>}
              </div>
              {savedFlash && <span style={{ ...t.label, fontSize: 9, color: c.accent }}>SAVED ✓</span>}
            </div>

            {!form || loadingDetail ? (
              <div style={{ padding: 20 }}><span style={{ ...t.bodySmall, color: c.muted }}>{loadingDetail ? "Loading…" : "Select an event to edit."}</span></div>
            ) : (
              <div className="flex flex-col" style={{ padding: 20, gap: 18 }}>
                {/* Cover */}
                <div className="flex flex-col items-center justify-center" style={{ gap: 8, height: 150, backgroundColor: "#1e1d22", border: `1px solid ${c.rule}`, backgroundImage: form.image ? `url(${form.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                  {!form.image && <><Icon name="image" size={26} style={{ color: c.faint }} /><span style={{ ...t.label, fontSize: 10, color: c.faint }}>COVER IMAGE</span></>}
                  <div className="flex" style={{ gap: 8 }}>
                    <button onClick={() => fileRef.current?.click()} className="flex items-center cursor-pointer" style={{ ...t.label, fontSize: 10, gap: 6, padding: "6px 10px", color: c.text, background: "rgba(0,0,0,0.5)", border: `1px solid ${c.ruleStrong}` }}>
                      <Icon name="upload" size={12} /> REPLACE
                    </button>
                    {form.image && (
                      <button onClick={removeCover} className="flex items-center cursor-pointer" style={{ ...t.label, fontSize: 10, gap: 6, padding: "6px 10px", color: c.accent, background: "rgba(0,0,0,0.5)", border: `1px solid ${c.ruleStrong}` }}>
                        <Icon name="trash" size={12} /> REMOVE
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickCover} />
                </div>

                <EditField label="TITLE" value={form.name} onChange={(v) => set({ name: v })} />
                <EditField label="TYPE (comma-separated)" value={form.typeStr} onChange={(v) => set({ typeStr: v })} />
                <EditField label="DATE & TIME" type="datetime-local" value={form.startDate} onChange={(v) => set({ startDate: v })} />
                <EditField label="VENUE" value={form.venue} onChange={(v) => set({ venue: v })} />

                {/* Status override */}
                <div className="flex flex-col" style={{ gap: 7 }}>
                  <span style={{ ...t.label, fontSize: 10, color: c.faint }}>STATUS</span>
                  <select value={form.statusOverride} onChange={(e) => set({ statusOverride: e.target.value })} style={{ ...t.bodySmall, padding: "11px 13px", background: "transparent", color: c.text, border: `1px solid ${c.ruleStrong}`, outline: "none" }}>
                    <option value="">Auto (from dates)</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="FINISHED">Finished</option>
                  </select>
                </div>

                {/* More fields */}
                <button onClick={() => setShowMore((s) => !s)} className="flex items-center justify-between cursor-pointer" style={{ padding: "11px 13px", background: c.panel, border: `1px solid ${c.rule}` }}>
                  <span style={{ ...t.bodySmall, color: c.muted }}>Overview · Objectives · Fees · Target Participants</span>
                  <span style={{ color: c.muted, display: "flex", transform: showMore ? "rotate(180deg)" : "none" }}><Icon name="chevron-down" size={15} /></span>
                </button>
                {showMore && (
                  <div className="flex flex-col" style={{ gap: 18 }}>
                    <EditField label="OVERVIEW" value={form.overview} onChange={(v) => set({ overview: v })} multiline />
                    <EditField label="MAIN OBJECTIVE" value={form.mainObjective} onChange={(v) => set({ mainObjective: v })} multiline />
                    <EditField label="SPECIFIC OBJECTIVES (one per line)" value={form.specificObjectivesStr} onChange={(v) => set({ specificObjectivesStr: v })} multiline />
                    <EditField label="TARGET PARTICIPANTS" value={form.targetParticipants} onChange={(v) => set({ targetParticipants: v })} />
                    <EditField label="REGISTRATION FEES" value={form.registrationFees} onChange={(v) => set({ registrationFees: v })} />
                  </div>
                )}

                <div style={{ height: 1, backgroundColor: c.rule }} />

                {/* Registrations & attendance */}
                <div className="flex flex-col" style={{ gap: 9 }}>
                  <span style={{ ...t.label, color: c.faint }}>REGISTRATIONS & ATTENDANCE</span>
                  <div style={{ height: 1, backgroundColor: c.rule }} />
                </div>
                <div className="flex" style={{ gap: 28 }}>
                  {[["REGISTERED", regs.length], ["CHECKED IN", checkedIn]].map(([l, n]) => (
                    <div key={l} className="flex flex-col" style={{ gap: 5 }}>
                      <span style={{ fontFamily: font.display, fontSize: 26, fontWeight: 500, color: c.text }}>{n}</span>
                      <span style={{ ...t.label, fontSize: 9, color: c.faint }}>{l}</span>
                    </div>
                  ))}
                </div>

                <div style={{ border: `1px solid ${c.rule}`, maxHeight: 300, overflowY: "auto" }}>
                  <div className="flex items-center" style={{ padding: "10px 14px", background: c.panel, borderBottom: `1px solid ${c.rule}` }}>
                    <span className="flex-1" style={{ ...t.label, fontSize: 9, color: c.faint }}>ATTENDEE</span>
                    <span style={{ width: 44, textAlign: "center", ...t.label, fontSize: 9, color: c.faint }}>REG</span>
                    <span style={{ width: 44, textAlign: "center", ...t.label, fontSize: 9, color: c.faint }}>ATT</span>
                  </div>
                  {regs.length === 0 && <div style={{ padding: "14px" }}><span style={{ ...t.bodySmall, color: c.muted }}>No registrations yet.</span></div>}
                  {regs.map((r, i) => {
                    const attended = !!r.attendance;
                    return (
                      <div key={r.id} className="flex items-center" style={{ padding: "10px 14px", borderBottom: i < regs.length - 1 ? `1px solid ${c.rule}` : "none" }}>
                        <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                          <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.fullName}</span>
                          <span style={{ ...t.mono, color: c.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.schoolEmail}</span>
                        </div>
                        <div style={{ width: 44 }} className="flex justify-center">
                          <CheckBox on onClick={undefined} c={c} />
                        </div>
                        <div style={{ width: 44 }} className="flex justify-center">
                          <CheckBox on={attended} onClick={attended ? undefined : () => checkIn(r.studentNumber)} c={c} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={exportCsv} className="flex items-center cursor-pointer" style={{ ...t.label, fontSize: 10, gap: 6, padding: "7px 11px", color: c.text, border: `1px solid ${c.ruleStrong}` }}>
                    <Icon name="download" size={12} /> EXPORT CSV
                  </button>
                  <AdminButton onClick={saveDetails} disabled={saving} icon="check">{saving ? "SAVING…" : "SAVE CHANGES"}</AdminButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  );
}

function CheckBox({ on, onClick, c }: { on: boolean; onClick?: () => void; c: ReturnType<typeof useDS>["c"] }) {
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
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={base} />
      )}
    </div>
  );
}
