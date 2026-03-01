"use client";

import { useState, useRef } from "react";

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const SEMESTERS = [
  { label: "1st Semester", value: "FIRST" },
  { label: "2nd Semester", value: "SECOND" },
  { label: "3rd Semester", value: "THIRD" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function EventCreationModal({ isOpen, onClose, onCreated }: EventCreationModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventSemester, setEventSemester] = useState("FIRST");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Schedule
  const [venue, setVenue] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Step 3: Pricing
  const [price, setPrice] = useState("0");
  const [priceMember, setPriceMember] = useState("0");
  const [priceNonMember, setPriceNonMember] = useState("0");

  // Step 4: Multi-day
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [subEvents, setSubEvents] = useState<
    { name: string; description: string; venue: string; dayOfWeek: string; startDate: string; endDate: string }[]
  >([]);

  if (!isOpen) return null;

  const TOTAL_STEPS = 4;

  const addSubEvent = () => {
    setSubEvents([
      ...subEvents,
      { name: "", description: "", venue: venue, dayOfWeek: "", startDate: "", endDate: "" },
    ]);
  };

  const updateSubEvent = (idx: number, field: string, value: string) => {
    const updated = [...subEvents];
    (updated[idx] as Record<string, string>)[field] = value;
    setSubEvents(updated);
  };

  const removeSubEvent = (idx: number) => {
    setSubEvents(subEvents.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          eventSemester,
          venue,
          dayOfWeek,
          startDate,
          endDate: endDate || startDate,
          price: Number(price),
          priceMember: Number(priceMember),
          priceNonMember: Number(priceNonMember),
          isMultiDay,
          image: imageUrl,
          subEvents: isMultiDay ? subEvents : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      onCreated?.();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setEventSemester("FIRST");
    setVenue("");
    setDayOfWeek("Monday");
    setStartDate("");
    setEndDate("");
    setPrice("0");
    setPriceMember("0");
    setPriceNonMember("0");
    setIsMultiDay(false);
    setSubEvents([]);
    setImageUrl(null);
    setError("");
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("bucket", "events");
      formData.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImageUrl(data.urls[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest">
              Create Event
            </p>
            <p className="text-xs font-['Arian-light'] text-gray-400 mt-0.5">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 transition-colors ${i < step ? "bg-[#CF78EC]" : "bg-gray-100"}`}
            />
          ))}
        </div>

        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 font-['Arian-light']">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <h3 className="text-sm font-['Arian-bold'] text-gray-900">Basic Information</h3>
              <InputField label="Event Name" value={name} onChange={setName} required />
              <div>
                <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC] resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
                  Semester
                </label>
                <select
                  value={eventSemester}
                  onChange={(e) => setEventSemester(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC] bg-white"
                >
                  {SEMESTERS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
                  Event Image
                </label>
                {imageUrl ? (
                  <div className="relative border border-gray-200">
                    <img src={imageUrl} alt="Event" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 flex items-center justify-center text-gray-500 hover:text-red-500 cursor-pointer border border-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="w-full border border-dashed border-gray-300 py-6 flex flex-col items-center gap-1 text-gray-400 hover:text-[#CF78EC] hover:border-[#CF78EC] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {imageUploading ? (
                      <div className="w-4 h-4 border-2 border-gray-200 border-t-[#CF78EC] animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="square" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-['Arian-bold'] uppercase tracking-widest">Upload Image</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
              </div>
            </>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <>
              <h3 className="text-sm font-['Arian-bold'] text-gray-900">Scheduling</h3>
              <InputField label="Venue" value={venue} onChange={setVenue} required />
              <div>
                <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC] bg-white"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Start Date & Time" value={startDate} onChange={setStartDate} type="datetime-local" required />
                <InputField label="End Date & Time" value={endDate} onChange={setEndDate} type="datetime-local" />
              </div>
            </>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <>
              <h3 className="text-sm font-['Arian-bold'] text-gray-900">Pricing</h3>
              <InputField label="Officers / Admin Price (₱)" value={price} onChange={setPrice} type="number" />
              <InputField label="Member Price (₱)" value={priceMember} onChange={setPriceMember} type="number" />
              <InputField label="Non-Member Price (₱)" value={priceNonMember} onChange={setPriceNonMember} type="number" />
            </>
          )}

          {/* Step 4: Multi-day */}
          {step === 4 && (
            <>
              <h3 className="text-sm font-['Arian-bold'] text-gray-900">Multi-Day Setup</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMultiDay(!isMultiDay)}
                  className={`w-10 h-5 flex items-center cursor-pointer transition-colors ${isMultiDay ? "bg-[#CF78EC]" : "bg-gray-200"}`}
                >
                  <div className={`w-4 h-4 bg-white border border-gray-300 transition-transform ${isMultiDay ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm font-['Arian-light'] text-gray-700">This is a multi-day event</span>
              </div>

              {isMultiDay && (
                <div className="space-y-4 mt-4">
                  {subEvents.map((sub, idx) => (
                    <div key={idx} className="border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-['Arian-bold'] text-[#CF78EC] uppercase tracking-widest">
                          Day {idx + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeSubEvent(idx)}
                          className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <InputField
                        label="Day Name"
                        value={sub.name}
                        onChange={(v) => updateSubEvent(idx, "name", v)}
                        placeholder={`${name} — Day ${idx + 1}`}
                      />
                      <InputField
                        label="Description"
                        value={sub.description}
                        onChange={(v) => updateSubEvent(idx, "description", v)}
                      />
                      <InputField
                        label="Venue"
                        value={sub.venue}
                        onChange={(v) => updateSubEvent(idx, "venue", v)}
                      />
                      <div>
                        <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
                          Day of Week
                        </label>
                        <select
                          value={sub.dayOfWeek}
                          onChange={(e) => updateSubEvent(idx, "dayOfWeek", e.target.value)}
                          className="w-full border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC] bg-white"
                        >
                          <option value="">Select day</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InputField
                          label="Start"
                          value={sub.startDate}
                          onChange={(v) => updateSubEvent(idx, "startDate", v)}
                          type="datetime-local"
                        />
                        <InputField
                          label="End"
                          value={sub.endDate}
                          onChange={(v) => updateSubEvent(idx, "endDate", v)}
                          type="datetime-local"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSubEvent}
                    className="w-full border border-dashed border-gray-300 py-2 text-xs font-['Arian-bold'] text-gray-400 hover:text-[#CF78EC] hover:border-[#CF78EC] transition-colors cursor-pointer uppercase tracking-widest"
                  >
                    + Add Day
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 1 ? setStep(step - 1) : (onClose(), resetForm())}
            className="text-sm font-['Arian-bold'] text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 text-sm font-['Arian-bold'] text-white bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm font-['Arian-bold'] text-white bg-[#CF78EC] hover:bg-[#b560d4] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1">
        {label} {required && <span className="text-[#CF78EC]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 px-3 py-2 text-sm font-['Arian-light'] text-gray-900 focus:outline-none focus:border-[#CF78EC]"
      />
    </div>
  );
}
