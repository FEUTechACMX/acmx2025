"use client";

import { useState, useEffect } from "react";

interface AttendanceLookupProps {
  eventId: string;
  subEvents?: { eventId: string; name: string }[];
}

interface AttendanceResult {
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

export default function AttendanceLookup({ eventId, subEvents }: AttendanceLookupProps) {
  const hasMultipleDays = subEvents && subEvents.length > 0;
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [studentNumber, setStudentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Build days list
  const days = hasMultipleDays
    ? [
        { eventId, label: "All Days" },
        ...subEvents.map((sub, idx) => ({
          eventId: sub.eventId,
          label: `Day ${idx + 1}`,
        })),
      ]
    : [{ eventId, label: "Event" }];

  const activeEventId = days[selectedDayIdx].eventId;

  // Auto-fill student number for logged-in users
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.studentId) {
            setStudentNumber(data.user.studentId);
            setAutoFilled(true);
          }
        }
      } catch { /* not logged in */ }
    }
    fetchUser();
  }, []);

  // Auto-search when student number is auto-filled
  useEffect(() => {
    if (autoFilled && studentNumber) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFilled, activeEventId]);

  const handleSearch = async () => {
    if (!studentNumber.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    try {
      const res = await fetch(
        `/api/events/${activeEventId}/attendance-lookup?studentNumber=${encodeURIComponent(studentNumber.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.found) {
          setResult(data.attendance);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Reset result when switching days
  useEffect(() => {
    setResult(null);
    setNotFound(false);
  }, [selectedDayIdx]);

  return (
    <div className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-2 h-2 bg-[#CF78EC] shrink-0" />
        <h2 className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest">
          Proof of Attendance
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Day tabs for multi-day events */}
      {hasMultipleDays && (
        <div className="inline-flex border border-gray-200 mb-5">
          {days.map((day, idx) => (
            <button
              key={day.eventId}
              onClick={() => setSelectedDayIdx(idx)}
              className={`px-3 py-1.5 text-[10px] font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer ${
                selectedDayIdx === idx
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              } ${idx > 0 ? "border-l border-gray-200" : ""}`}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter student number"
          className="flex-1 border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC]"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !studentNumber.trim()}
          className="px-4 py-2 text-xs font-['Arian-bold'] text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 uppercase tracking-wider"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Name", "Student #", "Email", "Year", "Program", "Section", "Time In", "Time Out"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-['Arian-bold'] text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#CF78EC]/5">
                <td className="px-4 py-2 text-xs font-['Arian-bold'] text-gray-900">{result.fullName}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">{result.studentNumber}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">{result.schoolEmail}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">{result.yearLevel}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">{result.degreeProgram}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600">{result.section}</td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600 whitespace-nowrap">
                  {new Date(result.timeIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2 text-xs font-['Arian-light'] text-gray-600 whitespace-nowrap">
                  {result.timeOut
                    ? new Date(result.timeOut).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {notFound && (
        <p className="mt-4 text-sm font-['Arian-light'] text-gray-400">
          No attendance record found for &quot;{studentNumber}&quot; on this event.
        </p>
      )}
    </div>
  );
}
