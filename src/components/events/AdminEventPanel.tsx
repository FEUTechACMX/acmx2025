"use client";

import { useEffect, useState, useRef } from "react";

interface AdminEventPanelProps {
  eventId: string;
}

type TabKey = "registrations" | "attendance" | "images" | "status";

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

export default function AdminEventPanel({ eventId }: AdminEventPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("registrations");

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
        {(["registrations", "attendance", "images", "status"] as TabKey[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-['Arian-bold'] uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              } ${tab !== "registrations" ? "border-l border-gray-200" : ""}`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Tab content */}
      {activeTab === "registrations" && <RegistrationsTab eventId={eventId} />}
      {activeTab === "attendance" && <AttendanceTab eventId={eventId} />}
      {activeTab === "images" && <ImagesTab eventId={eventId} />}
      {activeTab === "status" && <StatusTab eventId={eventId} />}
    </div>
  );
}

/* ───────────────────── REGISTRATIONS TAB ───────────────────── */

function RegistrationsTab({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/events/${eventId}/registrations`);
        if (!res.ok) return;
        const data = await res.json();
        setTotal(data.total);
        setChartData(data.chartData);
        setRegistrations(data.registrations);
      } catch (err) {
        console.error("Failed to fetch registrations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  if (loading) return <LoadingSpinner />;

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

function AttendanceTab({ eventId }: { eventId: string }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 ${connected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
        />
        <span className="text-xs font-['Arian-light'] text-gray-400">
          {connected ? "Live — updates every 3 seconds" : "Connecting..."}
        </span>
        <span className="text-xs font-['Arian-bold'] text-gray-900 ml-auto">
          {attendance.length} checked in
        </span>
      </div>

      {/* Table */}
      {attendance.length > 0 ? (
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
        <p className="text-sm font-['Arian-light'] text-gray-400 text-center py-8">
          No attendance records yet. Records will appear live as students scan
          in.
        </p>
      )}
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
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentStatus(data.statusOverride || null);
          setDescription(data.description || "");
        }
      } catch (err) {
        console.error("Failed to load event data:", err);
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

    try {
      const res = await fetch(`/api/events/${eventId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusOverride: status }),
      });

      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleDescriptionSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/events/${eventId}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (res.ok) setSaved(true);
    } catch (err) {
      console.error("Failed to update description:", err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) return <LoadingSpinner />;

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
