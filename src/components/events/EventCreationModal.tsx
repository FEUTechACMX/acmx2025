"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import Modal, { type ModalMessage } from "@/components/ds/Modal";
import { Field, Segmented } from "@/components/ds/Field";
import Button from "@/components/ds/Button";
import { useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";

/**
 * Create Event — rebuilt on the design system.
 *
 * This was the last component still styled through the legacy Tailwind palette,
 * and the reason `globals.css` still needed its wall of `!important` dark-mode
 * overrides (CLEANUP.md §8.1/§8.2). Unlike the registration wizard — a public
 * flow, ported faithfully — this one is officer-only, so it is rebuilt in the
 * system's own idiom rather than repainted.
 *
 * What that buys beyond colour: `ds/Modal` brings a focus trap, Esc and
 * scrim dismissal with a dirty-guard, scroll lock and a portal. The old markup
 * was a bare `fixed inset-0` div with none of that — you could Tab straight out
 * of the dialog into the page behind it, and a stray scrim click threw away
 * everything typed.
 */

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const SEMESTERS = [
  { label: "1st", value: "FIRST" },
  { label: "2nd", value: "SECOND" },
  { label: "3rd", value: "THIRD" },
] as const;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STEPS = ["Details", "Schedule", "Pricing", "Days"] as const;
const TOTAL_STEPS = STEPS.length;

type SubEvent = {
  name: string;
  description: string;
  venue: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
};

/**
 * Select and Textarea, in the system's voice. The DS has no primitive for
 * either yet; these match `Field`'s boxed skin so a form doesn't visibly change
 * material halfway down. Worth promoting into `ds/` the moment a third screen
 * needs them.
 */
function Select({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const { c } = useDS();
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex flex-col" style={{ gap: "0.5rem" }}>
      <label
        htmlFor={id}
        style={{
          ...t.label,
          color: focus ? c.text : c.faint,
          textTransform: "uppercase",
          transition: `color ${motion.fast}`,
        }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="cursor-pointer"
        style={{
          ...t.body,
          width: "100%",
          background: "transparent",
          color: c.text,
          border: `1px solid ${focus ? c.accent : c.rule}`,
          borderRadius: 0,
          outline: "none",
          padding: "0.75rem 0.85rem",
          appearance: "none",
          transition: `border-color ${motion.fast}`,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  id,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const { c } = useDS();
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex flex-col" style={{ gap: "0.5rem" }}>
      <label
        htmlFor={id}
        style={{
          ...t.label,
          color: focus ? c.text : c.faint,
          textTransform: "uppercase",
          transition: `color ${motion.fast}`,
        }}
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          ...t.body,
          width: "100%",
          background: "transparent",
          color: c.text,
          border: `1px solid ${focus ? c.accent : c.rule}`,
          borderRadius: 0,
          outline: "none",
          padding: "0.75rem 0.85rem",
          resize: "vertical",
          transition: `border-color ${motion.fast}`,
        }}
      />
    </div>
  );
}

export default function EventCreationModal({ isOpen, onClose, onCreated }: EventCreationModalProps) {
  const { c } = useDS();
  const uid = useId();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<ModalMessage | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventSemester, setEventSemester] = useState<"FIRST" | "SECOND" | "THIRD">("FIRST");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [venue, setVenue] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [price, setPrice] = useState("0");
  const [priceMember, setPriceMember] = useState("0");
  const [priceNonMember, setPriceNonMember] = useState("0");

  const [isMultiDay, setIsMultiDay] = useState(false);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);

  // Anything typed makes a stray Esc or scrim click worth a confirmation.
  const dirty = !!(name || description || venue || startDate || imageUrl || subEvents.length);

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
    setMessage(null);
  };

  const close = () => {
    onClose();
    resetForm();
  };

  const updateSubEvent = (idx: number, patch: Partial<SubEvent>) =>
    setSubEvents((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("bucket", "events");
      formData.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.urls[0]);
    } catch (err) {
      setMessage({
        tone: "danger",
        text: err instanceof Error ? err.message : "Image upload failed",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Caught here rather than at the API, so the officer isn't told "failed"
    // for something the form could have said on the step it happened.
    if (!name.trim()) return setMessage({ tone: "danger", text: "The event needs a name." });
    if (!venue.trim()) return setMessage({ tone: "danger", text: "The event needs a venue." });
    if (!startDate) return setMessage({ tone: "danger", text: "The event needs a start date." });

    setLoading(true);
    setMessage(null);
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
          priceOfficer: Number(price),
          priceMember: Number(priceMember),
          priceNonMember: Number(priceNonMember),
          isMultiDay,
          image: imageUrl,
          subEvents: isMultiDay ? subEvents : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create event");
      }

      onCreated?.();
      close();
    } catch (err) {
      setMessage({
        tone: "danger",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="Create Event"
      subtitle={`Step ${step} of ${TOTAL_STEPS} · ${STEPS[step - 1]}`}
      message={message}
      dirty={dirty}
      labelledBy={`${uid}-title`}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : close())}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating…" : "Create Event"}
            </Button>
          )}
        </>
      }
    >
      {/* Progress — four hairlines, filled as far as you've come. */}
      <div className="flex" style={{ gap: 4 }}>
        {STEPS.map((label, i) => (
          <div
            key={label}
            title={label}
            style={{
              height: 2,
              flex: 1,
              backgroundColor: i < step ? c.accent : c.rule,
              transition: `background-color ${motion.fast}`,
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <Field
            label="Event name"
            id={`${uid}-name`}
            variant="boxed"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ACM Developers Week"
          />
          <Textarea
            label="Description"
            id={`${uid}-desc`}
            value={description}
            onChange={setDescription}
          />
          <div className="flex flex-col" style={{ gap: "0.5rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              Semester
            </span>
            <Segmented
              options={SEMESTERS}
              value={eventSemester}
              onChange={setEventSemester}
            />
          </div>

          <div className="flex flex-col" style={{ gap: "0.5rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              Cover image
            </span>
            {imageUrl ? (
              // The wrapper carries the height, because `fill` measures its parent.
              <div
                className="relative overflow-hidden"
                style={{ height: 160, border: `1px solid ${c.rule}` }}
              >
                <Image
                  src={imageUrl}
                  alt="Event cover"
                  fill
                  sizes="620px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove cover image"
                  style={{
                    ...t.label,
                    position: "absolute",
                    top: 8,
                    right: 8,
                    padding: "0.3rem 0.6rem",
                    cursor: "pointer",
                    backgroundColor: c.surface,
                    color: c.danger,
                    border: `1px solid ${c.danger}`,
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full cursor-pointer"
                style={{
                  ...t.label,
                  textTransform: "uppercase",
                  padding: "1.6rem 0",
                  color: c.faint,
                  backgroundColor: "transparent",
                  border: `1px dashed ${c.rule}`,
                  transition: `color ${motion.fast}, border-color ${motion.fast}`,
                  opacity: imageUploading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = c.accent;
                  e.currentTarget.style.borderColor = c.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = c.faint;
                  e.currentTarget.style.borderColor = c.rule;
                }}
              >
                {imageUploading ? "Uploading…" : "Upload image"}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
              }}
            />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Field
            label="Venue"
            id={`${uid}-venue`}
            variant="boxed"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="F1604 Case Room"
          />
          <Select
            label="Day of week"
            id={`${uid}-day`}
            value={dayOfWeek}
            onChange={setDayOfWeek}
            options={DAYS}
          />
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field
              label="Starts"
              id={`${uid}-start`}
              variant="boxed"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Field
              label="Ends"
              id={`${uid}-end`}
              variant="boxed"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hint="Defaults to the start"
            />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <Field
            label="Officer rate (₱)"
            id={`${uid}-p1`}
            variant="boxed"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Field
            label="Member rate (₱)"
            id={`${uid}-p2`}
            variant="boxed"
            type="number"
            value={priceMember}
            onChange={(e) => setPriceMember(e.target.value)}
          />
          <Field
            label="Non-member rate (₱)"
            id={`${uid}-p3`}
            variant="boxed"
            type="number"
            value={priceNonMember}
            onChange={(e) => setPriceNonMember(e.target.value)}
          />
        </>
      )}

      {step === 4 && (
        <>
          <div className="flex flex-col" style={{ gap: "0.5rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              Shape
            </span>
            <Segmented
              options={[
                { value: "single", label: "Single day" },
                { value: "multi", label: "Multi-day" },
              ]}
              value={isMultiDay ? "multi" : "single"}
              onChange={(v) => setIsMultiDay(v === "multi")}
            />
          </div>

          {isMultiDay && (
            <>
              {subEvents.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex flex-col"
                  style={{ border: `1px solid ${c.rule}`, padding: "1.1rem", gap: "1rem" }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ ...t.label, color: c.accent, textTransform: "uppercase" }}>
                      Day {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubEvents((prev) => prev.filter((_, i) => i !== idx))}
                      style={{
                        ...t.label,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        color: c.danger,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <Field
                    label="Day name"
                    id={`${uid}-sub${idx}-name`}
                    variant="boxed"
                    value={sub.name}
                    onChange={(e) => updateSubEvent(idx, { name: e.target.value })}
                    placeholder={`${name || "Event"} — Day ${idx + 1}`}
                  />
                  <Field
                    label="Venue"
                    id={`${uid}-sub${idx}-venue`}
                    variant="boxed"
                    value={sub.venue}
                    onChange={(e) => updateSubEvent(idx, { venue: e.target.value })}
                  />
                  <Select
                    label="Day of week"
                    id={`${uid}-sub${idx}-day`}
                    value={sub.dayOfWeek}
                    onChange={(v) => updateSubEvent(idx, { dayOfWeek: v })}
                    options={DAYS}
                    placeholder="Select day"
                  />
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <Field
                      label="Starts"
                      id={`${uid}-sub${idx}-start`}
                      variant="boxed"
                      type="datetime-local"
                      value={sub.startDate}
                      onChange={(e) => updateSubEvent(idx, { startDate: e.target.value })}
                    />
                    <Field
                      label="Ends"
                      id={`${uid}-sub${idx}-end`}
                      variant="boxed"
                      type="datetime-local"
                      value={sub.endDate}
                      onChange={(e) => updateSubEvent(idx, { endDate: e.target.value })}
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                block
                onClick={() =>
                  setSubEvents((prev) => [
                    ...prev,
                    { name: "", description: "", venue, dayOfWeek: "", startDate: "", endDate: "" },
                  ])
                }
              >
                + Add day
              </Button>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
