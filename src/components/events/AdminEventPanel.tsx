"use client";

import { useEffect, useState, useRef } from "react";

interface AdminEventPanelProps {
  eventId: string;
  eventName?: string;
}

type TabKey = "registrations" | "attendance" | "images" | "status" | "onsite";

interface RegistrationRecord {
  id: string;
  fullName: string;
  studentNumber: string;
  schoolEmail: string;
  yearLevel: number;
  degreeProgram: string;
  section: string;
  professor: string;
  role: string;
  createdAt: string;
}

interface AttendanceRecord {
  fullName: string;
  studentNumber: string;
  schoolEmail: string;
  yearLevel: number;
  degreeProgram: string;
  section: string;
  timeIn: string;
  timeOut: string | null;
  role: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}

export default function AdminEventPanel({ eventId, eventName = "Event" }: AdminEventPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("registrations");
  const [isSecretariat, setIsSecretariat] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          const role = data.user?.role;
          if (["ADMIN", "EXECUTIVES_MEDIA", "EXECUTIVES", "SECRETARIAT", "SECRETARIAT_JUNIOR_OFFICER"].includes(role)) {
            setIsSecretariat(true);
          }
        }
      } catch {}
    }
    checkRole();
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "registrations", label: "registrations" },
    { key: "attendance", label: "attendance" },
    { key: "images", label: "images" },
    { key: "status", label: "status" },
  ];
  if (isSecretariat) {
    tabs.push({ key: "onsite", label: "on-site reg" });
  }

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-2 h-2 bg-[#CF78EC] shrink-0" />
        <h2 className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest">
          Admin Panel
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Tabs */}
      <div className="inline-flex border border-gray-200 mb-6 flex-wrap">
        {tabs.map((tab, idx) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:bg-gray-50"
            } ${idx !== 0 ? "border-l border-gray-200" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "registrations" && <RegistrationsTab eventId={eventId} />}
      {activeTab === "attendance" && <AttendanceTab eventId={eventId} eventName={eventName} />}
      {activeTab === "images" && <ImagesTab eventId={eventId} />}
      {activeTab === "status" && <StatusTab eventId={eventId} />}
      {activeTab === "onsite" && isSecretariat && <OnsiteRegistrationTab eventId={eventId} />}
    </div>
  );
}

/* ───────────────────── REGISTRATIONS TAB ───────────────────── */

function RegistrationsTab({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setFetchError(null);
      try {
        const res = await fetch(`/api/events/${eventId}/registrations`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setFetchError(data.error || `Failed to load registrations (${res.status})`);
          return;
        }
        const data = await res.json();
        setTotal(data.total);
        setChartData(data.chartData);
        setRegistrations(data.registrations);
      } catch (err) {
        console.error("Failed to fetch registrations:", err);
        setFetchError("Network error — could not load registrations.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  if (loading) return <LoadingSpinner />;

  if (fetchError) {
    return (
      <div className="border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-600 font-['Arian-light']">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="border border-gray-100 p-5">
        <p className="text-3xl font-['Arian-bold'] text-gray-900">{total}</p>
        <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1" />
        <p className="text-xs font-['Arian-light'] text-gray-400">
          Total Registrations
        </p>
      </div>

      {/* Simple bar chart */}
      {chartData.length > 0 && (
        <div className="border border-gray-100 p-5">
          <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
            Registrations Per Day
          </h3>
          <div className="flex items-end gap-2 h-32">
            {chartData.map((point) => {
              const maxCount = Math.max(...chartData.map((d) => d.count));
              const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[10px] font-['Arian-bold'] text-gray-900">
                    {point.count}
                  </span>
                  <div
                    className="w-full bg-[#CF78EC] transition-all"
                    style={{
                      height: `${height}%`,
                      minHeight: point.count > 0 ? "4px" : "0",
                    }}
                  />
                  <span className="text-[9px] font-['Arian-light'] text-gray-400 whitespace-nowrap">
                    {new Date(point.date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      {registrations.length > 0 && (
        <div className="border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Name",
                  "Student #",
                  "Email",
                  "Year",
                  "Program",
                  "Section",
                  "Professor",
                  "Role",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-['Arian-bold'] text-gray-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr
                  key={reg.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-900">
                    {reg.fullName}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.studentNumber}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.schoolEmail}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.yearLevel}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.degreeProgram}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.section}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.professor}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {reg.role}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-400 whitespace-nowrap">
                    {new Date(reg.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {registrations.length === 0 && !loading && (
        <p className="text-sm font-['Arian-light'] text-gray-400 text-center py-8">
          No registrations yet.
        </p>
      )}
    </div>
  );
}

/* ───────────────────── ATTENDANCE TAB (SSE) ───────────────────── */

// Needed for Export to Excel
import * as XLSX from "xlsx";

function AttendanceTab({ eventId, eventName }: { eventId: string, eventName: string }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const [attendanceView, setAttendanceView] = useState<"table" | "graph">("table");
  const eventSourceRef = useRef<EventSource | null>(null);

  // new state for manual attendance
  const [manualStudentNumber, setManualStudentNumber] = useState("");
  const [manualLoadingMode, setManualLoadingMode] = useState<"in" | "out" | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  const handleManualAttendance = async (action: "in" | "out") => {
    setManualError(null);
    setManualSuccess(null);
    if (!manualStudentNumber.trim()) {
      setManualError("Please enter a student number.");
      return;
    }

    setManualLoadingMode(action);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber: manualStudentNumber.trim(), action }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setManualSuccess(`Recorded time-${action} for ${manualStudentNumber}`);
        setManualStudentNumber("");
      } else {
        setManualError(data.error || `Failed to record time-${action}.`);
      }
    } catch (err) {
      setManualError("Something went wrong.");
    } finally {
      setManualLoadingMode(null);
    }
  };

  const exportToExcel = () => {
    if (attendance.length === 0) return;

    const dataRows = attendance.map(rec => ({
      "Full Name": rec.fullName,
      "Student Number": rec.studentNumber,
      "School Email": rec.schoolEmail,
      "Year Level": rec.yearLevel,
      "Degree Program": rec.degreeProgram,
      "Section": rec.section,
      "Role": rec.role,
      "Time In": rec.timeIn ? new Date(rec.timeIn).toLocaleString("en-US") : "—",
      "Time Out": rec.timeOut ? new Date(rec.timeOut).toLocaleString("en-US") : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    
    // Sanitize eventName for filename
    const safeName = eventName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    XLSX.writeFile(workbook, `${safeName}_Attendance.xlsx`);
  };

  useEffect(() => {
    const es = new EventSource(`/api/events/${eventId}/attendance/stream`);

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAttendance(data.attendance || []);
      } catch {
        console.error("Failed to parse SSE data");
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      setConnected(false);
    };
  }, [eventId]);

  return (
    <div className="space-y-4">
      {/* Manual Attendance */}
      <div className="border border-gray-100 p-5 bg-gray-50 mb-4">
        <h3 className="text-xs font-['Arian-bold'] text-gray-900 uppercase tracking-widest mb-3">
          Manual Record Attendance
        </h3>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={manualStudentNumber}
            onChange={(e) => setManualStudentNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualAttendance("in")}
            placeholder="Student Number"
            className="flex-1 border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC]"
          />
          <button
            onClick={() => handleManualAttendance("in")}
            disabled={manualLoadingMode !== null}
            className="px-4 py-2 text-xs font-['Arian-bold'] text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            {manualLoadingMode === "in" ? "..." : "Time In"}
          </button>
          <button
            onClick={() => handleManualAttendance("out")}
            disabled={manualLoadingMode !== null}
            className="px-4 py-2 text-xs font-['Arian-bold'] text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            {manualLoadingMode === "out" ? "..." : "Time Out"}
          </button>
        </div>
        {manualError && <p className="mt-2 text-xs text-red-500 font-['Arian-light']">{manualError}</p>}
        {manualSuccess && <p className="mt-2 text-xs text-green-600 font-['Arian-light']">{manualSuccess}</p>}
      </div>

      {/* Live indicator & Export */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 ${connected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
          />
          <span className="text-xs font-['Arian-light'] text-gray-400">
            {connected ? "Live — updates every 3 seconds" : "Connecting..."}
          </span>
        </div>
        <span className="text-xs font-['Arian-bold'] text-gray-900 ml-auto hidden sm:inline-block">
          {attendance.length} checked in
        </span>
        <button
          onClick={exportToExcel}
          disabled={attendance.length === 0}
          className="ml-auto sm:ml-0 flex items-center gap-2 px-3 py-1.5 border border-[#CF78EC] text-[#CF78EC] hover:bg-[#CF78EC] hover:text-white transition-colors text-[10px] font-['Arian-bold'] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Sub-tabs for Table vs Data View */}
      <div className="flex gap-4 border-b border-gray-100 pb-2 mt-4">
        <button
          onClick={() => setAttendanceView("table")}
          className={`text-sm font-['Arian-bold'] uppercase tracking-widest transition-colors cursor-pointer ${attendanceView === "table" ? "text-[#CF78EC]" : "text-gray-400 hover:text-gray-900"}`}
        >
          Data Table
        </button>
        <button
          onClick={() => setAttendanceView("graph")}
          className={`text-sm font-['Arian-bold'] uppercase tracking-widest transition-colors cursor-pointer ${attendanceView === "graph" ? "text-[#CF78EC]" : "text-gray-400 hover:text-gray-900"}`}
        >
          Data View (Graphs)
        </button>
      </div>

      {attendance.length === 0 ? (
        <p className="text-sm font-['Arian-light'] text-gray-400 text-center py-8">
          No attendance records yet. Records will appear live as students scan in.
        </p>
      ) : attendanceView === "table" ? (
        /* Table View */
        <div className="border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Name",
                  "Student #",
                  "Email",
                  "Year",
                  "Program",
                  "Section",
                  "Role",
                  "Time In",
                  "Time Out",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[10px] font-['Arian-bold'] text-gray-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-50 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-900">
                    {rec.fullName}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {rec.studentNumber}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {rec.schoolEmail}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {rec.yearLevel}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {rec.degreeProgram}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    {rec.section}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">
                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] rounded tracking-wider">
                      {rec.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600 whitespace-nowrap">
                    {new Date(rec.timeIn).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600 whitespace-nowrap">
                    {rec.timeOut
                      ? new Date(rec.timeOut).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Graph View */
        <AttendanceGraphView attendance={attendance} />
      )}
    </div>
  );
}

function AttendanceGraphView({ attendance }: { attendance: AttendanceRecord[] }) {
  const [graphType, setGraphType] = useState<"total" | "members" | "non-members" | "officers">("total");

  // Officer roles list
  const officerRoles = [
    "ADMIN",
    "EXECUTIVES_MEDIA",
    "EXECUTIVES",
    "SECRETARIAT",
    "SECRETARIAT_JUNIOR_OFFICER",
    "FINANCE_JUNIOR_OFFICER",
    "MEDIA_OFFICER",
    "JUNIOR_OFFICER",
  ];

  // Bucket attendances into hour intervals (YYYY-MM-DD HH:00)
  const hourBuckets: Record<string, number> = {};

  attendance.forEach((rec) => {
    // Filter out records based on selected graph type
    let shouldInclude = false;
    if (graphType === "total") shouldInclude = true;
    else if (graphType === "members" && rec.role === "MEMBER") shouldInclude = true;
    else if (graphType === "non-members" && rec.role === "NON_MEMBER") shouldInclude = true;
    else if (graphType === "officers" && officerRoles.includes(rec.role)) shouldInclude = true;

    if (shouldInclude) {
      // Group by hour
      const date = new Date(rec.timeIn);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      
      const bucketKey = `${year}-${month}-${day} ${hour}:00`;
      hourBuckets[bucketKey] = (hourBuckets[bucketKey] || 0) + 1;
    }
  });

  // Sort keys chronologically
  const sortedKeys = Object.keys(hourBuckets).sort();
  const chartData = sortedKeys.map(key => ({
    time: key,
    count: hourBuckets[key]
  }));

  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { id: "total", label: "Total Attendance" },
          { id: "members", label: "Members" },
          { id: "non-members", label: "Non-Members" },
          { id: "officers", label: "Officers" }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setGraphType(opt.id as any)}
            className={`px-3 py-1.5 border text-[10px] font-['Arian-bold'] uppercase tracking-widest transition-colors ${
              graphType === opt.id
                ? "bg-[#CF78EC] text-white border-[#CF78EC]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="border border-gray-100 p-5">
        <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-4">
          Attendance Timeline (Hourly)
        </h3>
        
        {chartData.length > 0 ? (
          <div className="flex items-end gap-2 h-40 overflow-x-auto pb-4 custom-scrollbar">
            {chartData.map((point) => {
              const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
              const pointDate = new Date(point.time.replace(" ", "T"));
              
              return (
                <div
                  key={point.time}
                  className="flex-shrink-0 w-16 flex flex-col items-center gap-1 group relative"
                >
                  <span className="text-[10px] font-['Arian-bold'] text-gray-900 absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {point.count}
                  </span>
                  <div
                    className="w-full bg-[#CF78EC]/80 group-hover:bg-[#CF78EC] transition-all rounded-t-sm"
                    style={{
                      height: `${height}%`,
                      minHeight: "4px",
                    }}
                  />
                  <div className="text-center mt-1">
                    <span className="block text-[9px] font-['Arian-bold'] text-gray-600">
                      {pointDate.toLocaleTimeString("en-US", { hour: "numeric" })}
                    </span>
                    <span className="block text-[8px] font-['Arian-light'] text-gray-400">
                      {pointDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs font-['Arian-light'] text-gray-400 h-40 flex items-center justify-center">
            No data available for this selection.
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── STATUS TAB ───────────────────── */

function StatusTab({ eventId }: { eventId: string }) {
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const statusOptions = [
    {
      value: null,
      label: "Auto (date-based)",
      desc: "Status is calculated from start/end dates",
    },
    {
      value: "UPCOMING",
      label: "Upcoming",
      desc: "Force event to show as upcoming",
    },
    {
      value: "ONGOING",
      label: "Ongoing",
      desc: "Force event to show as ongoing",
    },
    {
      value: "FINISHED",
      label: "Finished",
      desc: "Force event to show as finished",
    },
  ];

  // Load current event data
  useEffect(() => {
    async function loadData() {
      setLoadError(null);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentStatus(data.statusOverride || null);
          setDescription(data.description || "");
        } else {
          setLoadError(`Failed to load event data (${res.status})`);
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
        setLoadError("Network error — could not load event data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const handleStatusChange = async (status: string | null) => {
    setCurrentStatus(status);
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusOverride: status }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || `Failed to update status (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setSaveError("Network error — could not save status.");
    } finally {
      setSaving(false);
      setTimeout(() => { setSaved(false); setSaveError(null); }, 3000);
    }
  };

  const handleDescriptionSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (res.ok) {
        setSaved(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || `Failed to save description (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to update description:", err);
      setSaveError("Network error — could not save description.");
    } finally {
      setSaving(false);
      setTimeout(() => { setSaved(false); setSaveError(null); }, 3000);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (loadError) {
    return (
      <div className="border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-600 font-['Arian-light']">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Status Override Section */}
      <div>
        <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-3">
          Event Category Override
        </h3>
        <p className="text-xs font-['Arian-light'] text-gray-400 mb-4">
          Override the automatically-calculated event status. Select
          &quot;Auto&quot; to let dates determine the category.
        </p>

        <div className="space-y-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value ?? "auto"}
              onClick={() => handleStatusChange(opt.value)}
              disabled={saving}
              className={`w-full text-left border p-4 transition-colors cursor-pointer ${
                currentStatus === opt.value
                  ? "border-[#CF78EC] bg-[#CF78EC]/5"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className="text-sm font-['Arian-bold'] text-gray-900">
                {opt.label}
              </p>
              <p className="text-xs font-['Arian-light'] text-gray-400 mt-0.5">
                {opt.desc}
              </p>
            </button>
          ))}
        </div>

        {saved && (
          <p className="text-xs font-['Arian-bold'] text-green-600 mt-3">
            ✓ Status updated
          </p>
        )}
        {saveError && (
          <p className="text-xs font-['Arian-bold'] text-red-500 mt-3">
            ✗ {saveError}
          </p>
        )}
      </div>

      {/* Description Section */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-3">
          Event Description
        </h3>
        <p className="text-xs font-['Arian-light'] text-gray-400 mb-3">
          Supports markdown formatting: **bold**, _italic_, [links](url), and
          lists
        </p>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter event description with optional markdown formatting..."
          className="w-full h-40 p-3 border border-gray-200 text-sm font-['Arian-light'] text-gray-900 placeholder-gray-400 focus:border-[#CF78EC] focus:outline-none resize-none"
        />

        <div className="mt-3 text-xs font-['Arian-light'] text-gray-400 bg-gray-50 p-3 border border-gray-100">
          <p className="font-['Arian-bold'] mb-2">Markdown hints:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <code className="bg-gray-200 px-1">**text**</code> for bold
            </li>
            <li>
              <code className="bg-gray-200 px-1">_text_</code> for italic
            </li>
            <li>
              <code className="bg-gray-200 px-1">[text](url)</code> for links
            </li>
            <li>
              <code className="bg-gray-200 px-1">- item</code> for bullet lists
            </li>
            <li>
              <code className="bg-gray-200 px-1">1. item</code> for numbered
              lists
            </li>
          </ul>
        </div>

        <button
          onClick={handleDescriptionSave}
          disabled={saving}
          className="w-full mt-4 py-2 px-4 text-sm font-['Arian-bold'] uppercase tracking-widest text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Description"}
        </button>

        {saved && (
          <p className="text-xs font-['Arian-bold'] text-green-600 mt-2">
            ✓ Description saved
          </p>
        )}
        {saveError && (
          <p className="text-xs font-['Arian-bold'] text-red-500 mt-2">
            ✗ {saveError}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── IMAGES TAB ───────────────────── */

function ImagesTab({ eventId }: { eventId: string }) {
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const eventInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(false);
  }, [eventId]);

  const uploadFiles = async (
    files: File[],
    bucket: string,
  ): Promise<string[]> => {
    const formData = new FormData();
    formData.append("bucket", bucket);
    for (const file of files) {
      formData.append("files", file);
    }
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.urls;
  };

  const handleUpload = async (
    files: File[],
    type: "cardImage" | "image" | "gallery",
  ) => {
    setUploading(type);
    try {
      const bucket = type === "cardImage" ? "eventCard" : "events";
      const urls = await uploadFiles(files, bucket);
      if (urls.length === 0) {
        setUploading(null);
        return;
      }

      if (type === "cardImage") {
        setCardImage(urls[0]);
      } else if (type === "image") {
        setEventImage(urls[0]);
      } else {
        setGallery((prev) => [...prev, ...urls]);
      }
      setDirty(true);
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(null);
  };

  const removeGalleryImage = (idx: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const clearAllGallery = () => {
    setGallery([]);
    setDirty(true);
  };

  const removeImage = (type: "cardImage" | "image") => {
    if (type === "cardImage") setCardImage(null);
    else setEventImage(null);
    setDirty(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch(`/api/events/${eventId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardImage,
          image: eventImage,
          gallery,
        }),
      });
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error("Save error:", err);
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Card Image */}
      <div>
        <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-3">
          Card Image{" "}
          <span className="text-gray-300 normal-case">→ eventCard bucket</span>
        </h3>
        <p className="text-xs font-['Arian-light'] text-gray-400 mb-3">
          The background image shown on event cards in the list view.
        </p>
        <ImageSlot
          url={cardImage}
          uploading={uploading === "cardImage"}
          inputRef={cardInputRef}
          onUpload={(f) => handleUpload([f], "cardImage")}
          onRemove={() => removeImage("cardImage")}
        />
      </div>

      {/* Event Page Image */}
      <div>
        <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest mb-3">
          Event Page Image{" "}
          <span className="text-gray-300 normal-case">→ events bucket</span>
        </h3>
        <p className="text-xs font-['Arian-light'] text-gray-400 mb-3">
          The main hero image on the event detail page.
        </p>
        <ImageSlot
          url={eventImage}
          uploading={uploading === "image"}
          inputRef={eventInputRef}
          onUpload={(f) => handleUpload([f], "image")}
          onRemove={() => removeImage("image")}
        />
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-widest">
            Gallery{" "}
            <span className="text-gray-300 normal-case">→ events bucket</span>
          </h3>
          {gallery.length > 0 && (
            <button
              type="button"
              onClick={clearAllGallery}
              className="text-[10px] font-['Arian-bold'] text-red-400 hover:text-red-500 uppercase tracking-widest cursor-pointer transition-colors"
            >
              Remove All
            </button>
          )}
        </div>
        <p className="text-xs font-['Arian-light'] text-gray-400 mb-3">
          Photos for ongoing/finished events. Displayed as a carousel on the
          event page.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {gallery.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square border border-gray-100"
            >
              <img
                src={url}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 flex items-center justify-center text-gray-500 hover:text-red-500 cursor-pointer border border-gray-200 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={uploading === "gallery"}
          className="w-full border border-dashed border-gray-300 py-4 flex items-center justify-center gap-2 text-gray-400 hover:text-[#CF78EC] hover:border-[#CF78EC] transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading === "gallery" ? (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#CF78EC] animate-spin" />
          ) : (
            <span className="text-xs font-['Arian-bold'] uppercase tracking-widest">
              + Add Photos
            </span>
          )}
        </button>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0)
              handleUpload(Array.from(files), "gallery");
          }}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={saving || (!dirty && !uploading)}
          className="w-full py-3 text-sm font-['Arian-bold'] uppercase tracking-widest text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
        {!dirty && !uploading && (
          <p className="text-center text-[10px] font-['Arian-light'] text-gray-400 mt-2">
            Upload or remove images, then click Save Changes.
          </p>
        )}
      </div>
    </div>
  );
}

function ImageSlot({
  url,
  uploading,
  inputRef,
  onUpload,
  onRemove,
}: {
  url: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (f: File) => void;
  onRemove: () => void;
}) {
  return (
    <>
      {url ? (
        <div className="relative border border-gray-200">
          <img src={url} alt="" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 w-6 h-6 bg-white/90 flex items-center justify-center text-gray-500 hover:text-red-500 cursor-pointer border border-gray-200"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-gray-300 py-6 flex flex-col items-center gap-1 text-gray-400 hover:text-[#CF78EC] hover:border-[#CF78EC] transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#CF78EC] animate-spin" />
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-['Arian-bold'] uppercase tracking-widest">
                Upload
              </span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </>
  );
}

/* ───────────────────── LOADING SPINNER ───────────────────── */

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#CF78EC] animate-spin" />
    </div>
  );
}

/* ───────────────────── ON-SITE REGISTRATION TAB ───────────────────── */

function OnsiteRegistrationTab({ eventId }: { eventId: string }) {
  const [subTab, setSubTab] = useState<"member" | "non-member">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [studentNumberQuery, setStudentNumberQuery] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    eventId,
    studentNumber: "",
    fullName: "",
    schoolEmail: "",
    contactNumber: "",
    facebookLink: "",
    yearLevel: "",
    section: "",
    professor: "",
    degreeProgram: "",
  });

  const handleLookup = async () => {
    if (!studentNumberQuery.trim()) return;
    setQueryLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(studentNumberQuery.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        setFormData({
          ...formData, // retain eventId
          studentNumber: data.studentNumber || "",
          fullName: data.fullName || "",
          schoolEmail: data.schoolEmail || "",
          contactNumber: data.contactNumber || "",
          facebookLink: data.facebookLink || "",
          yearLevel: data.yearLevel || "",
          section: data.section || "",
          professor: data.professor || "",
          degreeProgram: data.degreeProgram || "",
        });
        setSuccess("User found. Details loaded.");
      } else {
        setError(data.error || "User not found.");
      }
    } catch (err) {
      setError("Failed to look up user.");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.studentNumber || !formData.fullName || !formData.schoolEmail || !formData.yearLevel) {
      setError("Please fill in required fields.");
      setLoading(false);
      return;
    }

    // If they are registering via the Non-Member tab, ensure they aren't actually a member in the DB
    if (subTab === "non-member") {
      try {
        const userCheck = await fetch(`/api/admin/users/${encodeURIComponent(formData.studentNumber.trim())}`);
        if (userCheck.ok) {
          const userData = await userCheck.json();
          // The API returns the user if found (which means they are a member)
          if (userData && userData.studentNumber) {
            setError(`This student is already a registered member (Role: ${userData.role?.replace(/_/g, " ") || 'MEMBER'}). Please use the Member tab.`);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Silently proceed if the check itself fails due to network issues, 
        // to avoid blocking all registrations when backend drops a request.
        console.error("Failed to verify member status during non-member registration:", err);
      }
    }

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Auto-record attendance after successful on-site registration
      let attendanceOk = false;
      try {
        const attRes = await fetch(`/api/events/${eventId}/attendance/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentNumber: formData.studentNumber }),
        });
        attendanceOk = attRes.ok;
      } catch {
        // Attendance recording failed but registration succeeded
      }

      setSuccess(
        attendanceOk
          ? "Successfully registered and attendance recorded!"
          : "Registered successfully, but attendance could not be recorded automatically."
      );
      // Reset form
      setFormData({
        eventId,
        studentNumber: "",
        fullName: "",
        schoolEmail: "",
        contactNumber: "",
        facebookLink: "",
        yearLevel: "",
        section: "",
        professor: "",
        degreeProgram: "",
      });
      setStudentNumberQuery("");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl border border-gray-100 p-6">
      <div className="flex gap-4 border-b border-gray-100 pb-4">
        <button
          onClick={() => { setSubTab("member"); setError(null); setSuccess(null); }}
          className={`text-sm font-['Arian-bold'] uppercase tracking-widest transition-colors cursor-pointer ${subTab === "member" ? "text-[#CF78EC]" : "text-gray-400 hover:text-gray-900"}`}
        >
          Member
        </button>
        <button
          onClick={() => { setSubTab("non-member"); setError(null); setSuccess(null); }}
          className={`text-sm font-['Arian-bold'] uppercase tracking-widest transition-colors cursor-pointer ${subTab === "non-member" ? "text-[#CF78EC]" : "text-gray-400 hover:text-gray-900"}`}
        >
          Non-Member
        </button>
      </div>

      {subTab === "member" && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={studentNumberQuery}
            onChange={(e) => setStudentNumberQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Search Student Number"
            className="flex-1 border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC]"
          />
          <button
            onClick={handleLookup}
            disabled={queryLoading}
            className="px-4 py-2 text-xs font-['Arian-bold'] text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            {queryLoading ? "..." : "Lookup"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 p-3">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 p-3">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Student Number *</label>
            <input name="studentNumber" value={formData.studentNumber} onChange={handleChange} required className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
            <input name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">School Email *</label>
            <input type="email" name="schoolEmail" value={formData.schoolEmail} onChange={handleChange} required className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</label>
            <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Year Level *</label>
            <select name="yearLevel" value={formData.yearLevel} onChange={handleChange} required className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none appearance-none bg-white">
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Degree Program</label>
            <input name="degreeProgram" value={formData.degreeProgram} onChange={handleChange} className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
            <input name="section" value={formData.section} onChange={handleChange} className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Professor</label>
            <input name="professor" value={formData.professor} onChange={handleChange} className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">Facebook Link</label>
          <input type="url" name="facebookLink" value={formData.facebookLink} onChange={handleChange} className="w-full border border-gray-200 px-3 py-2 text-sm focus:border-[#CF78EC] focus:outline-none bg-white" />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 mt-4 text-sm font-['Arian-bold'] uppercase tracking-widest text-white bg-[#CF78EC] hover:bg-[#b560d4] transition-colors cursor-pointer disabled:opacity-50">
          {loading ? "Registering..." : "Complete Registration"}
        </button>
      </form>
    </div>
  );
}
