"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useDS } from "@/components/ds";
import { motion } from "@/styles/design-system";

/**
 * Ported off the legacy Tailwind palette onto design-system tokens.
 *
 * Deliberately a *faithful* port: the five-step wizard, its proportions, spacing
 * and the Arian type are unchanged — this is the flow non-members use to
 * register, so it is the wrong place for a redesign. What changed is where the
 * colours come from. Every `bg-white` / `text-gray-*` / `bg-gray-*` / `bg-black`
 * / `*-red-*` class is gone, because those were the classes `globals.css` was
 * patching with ~60 `!important` dark-mode overrides (CLEANUP.md §8.1/§8.2).
 * Layout utilities (flex, padding, spacing) stay as Tailwind — they were never
 * what the overrides targeted.
 */

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onRegistrationSuccess?: () => void;
}

interface FormData {
  eventId: string;
  studentNumber: string;
  fullName: string;
  schoolEmail: string;
  contactNumber: string;
  facebookLink: string;
  yearLevel: string;
  section: string;
  professor: string;
  degreeProgram: string;
}

const STEP_LABELS = [
  "Personal Info",
  "Contact Details",
  "Academic Info",
  "Professor",
  "Confirm",
];

const TOTAL_STEPS = 5;

const LABEL_STYLE = {
  fontFamily: "'Arian-bold', sans-serif",
  fontSize: "0.75rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onRegistrationSuccess,
}) => {
  const { c } = useDS();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
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

  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reopening the modal starts at step 1 with no stale error. Adjusted during
  // render rather than in the effect below, which flashed the previous
  // attempt's step and error for a frame before resetting them.
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setStep(1);
      setError(null);
      setSubmitted(false);
    }
  }

  // Auto-fill for logged-in users
  useEffect(() => {
    if (!isOpen) return;

    async function prefill() {
      setPrefilling(true);
      try {
        const res = await fetch("/api/registration-prefill");
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            studentNumber: data.studentNumber || "",
            fullName: data.fullName || "",
            schoolEmail: data.schoolEmail || "",
            contactNumber: data.contactNumber || "",
            facebookLink: data.facebookLink || "",
            yearLevel: data.yearLevel || "",
            section: data.section || "",
            professor: data.professor || "",
            degreeProgram: data.degreeProgram || "",
          }));
        }
      } catch {
        /* signed out — the form stays empty and they type it themselves */
      } finally {
        setPrefilling(false);
      }
    }

    void prefill();
  }, [isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Safety: only submit from the final step
    if (step !== TOTAL_STEPS) return;

    setLoading(true);
    setError(null);

    // Basic validation
    if (
      !formData.studentNumber ||
      !formData.fullName ||
      !formData.schoolEmail ||
      !formData.yearLevel
    ) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // No `userId` in the payload: the endpoint derives identity from the
      // session and ignores anything the body claims (CLEANUP.md §2.2), so
      // sending one only implied it still mattered.
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // The button behind the modal flips to "Registered ✓" straight away.
      onRegistrationSuccess?.();

      // Confirmed in place rather than through `alert()`, which fired *after*
      // onClose — so the only acknowledgement a registrant got was an unstyled
      // OS dialog floating over a page that had already moved on (§6.6).
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md relative overflow-hidden"
        style={{ backgroundColor: c.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${c.rule}` }}
        >
          <h2
            style={{
              fontFamily: "'Arian-bold', sans-serif",
              fontSize: "1.125rem",
              color: c.text,
              letterSpacing: "-0.01em",
            }}
          >
            Event Registration
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
            style={{ color: c.faint, transition: `color ${motion.fast}` }}
            onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = c.faint)}
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M6 6l12 12M6 18L18 6"
              />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between mb-1">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    style={{
                      fontFamily: "'Arian-bold', sans-serif",
                      fontSize: "0.75rem",
                      transition: `background-color ${motion.fast}, color ${motion.fast}`,
                      backgroundColor: isActive
                        ? c.accent
                        : isComplete
                          ? c.text
                          : c.panel,
                      color: isActive || isComplete ? c.surface : c.faint,
                    }}
                  >
                    {isComplete ? (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className="mt-1.5"
                    style={{
                      fontFamily: "'Arian-light', sans-serif",
                      fontSize: "10px",
                      color: isActive ? c.accent : isComplete ? c.text : c.faint,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div
            className="mt-3 relative"
            style={{ height: 2, backgroundColor: c.panel }}
          >
            <div
              className="absolute top-0 left-0 h-full"
              style={{
                width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                backgroundColor: c.accent,
                transition: `width ${motion.base} ${motion.ease}`,
              }}
            />
          </div>
        </div>

        {/* Loading state for prefill */}
        {submitted ? (
          <div className="px-6 py-14 flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center mb-4"
              style={{
                width: "2.75rem",
                height: "2.75rem",
                color: c.accent,
                border: `1px solid ${c.accent}`,
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p
              style={{
                fontFamily: "'Arian-bold', sans-serif",
                fontSize: "1.05rem",
                color: c.text,
              }}
            >
              You&apos;re registered.
            </p>
            <p
              className="mt-2"
              style={{
                fontFamily: "'Arian-light', sans-serif",
                fontSize: "0.875rem",
                color: c.muted,
                maxWidth: "26rem",
              }}
            >
              Bring your student number to the door — the desk checks you in from it.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-5 py-2 cursor-pointer"
              style={{
                fontFamily: "'Arian-bold', sans-serif",
                fontSize: "0.875rem",
                backgroundColor: c.accent,
                color: "#ffffff",
                border: "none",
              }}
            >
              Done
            </button>
          </div>
        ) : prefilling ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center">
            <div
              className="w-5 h-5 animate-spin mb-3"
              style={{
                border: `2px solid ${c.rule}`,
                borderTopColor: c.accent,
              }}
            />
            <p
              style={{
                fontFamily: "'Arian-light', sans-serif",
                fontSize: "0.875rem",
                color: c.faint,
              }}
            >
              Loading your details...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          >
            <div className="px-6 py-5">
              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <FieldGroup
                    label="Student Number"
                    name="studentNumber"
                    type="text"
                    value={formData.studentNumber}
                    onChange={handleChange}
                    placeholder="e.g. 202211234"
                    required
                  />
                  <FieldGroup
                    label="Full Name"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Juan Dela Cruz"
                    required
                  />
                </div>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <FieldGroup
                    label="School Email"
                    name="schoolEmail"
                    type="email"
                    value={formData.schoolEmail}
                    onChange={handleChange}
                    placeholder="e.g. juan@fit.edu.ph"
                    required
                  />
                  <FieldGroup
                    label="Contact Number"
                    name="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="e.g. 09171234567"
                  />
                  <FieldGroup
                    label="Facebook Link"
                    name="facebookLink"
                    type="url"
                    value={formData.facebookLink}
                    onChange={handleChange}
                    placeholder="e.g. https://facebook.com/juan"
                  />
                </div>
              )}

              {/* Step 3: Academic Info */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label
                      className="block mb-1.5"
                      style={{ ...LABEL_STYLE, color: c.muted }}
                    >
                      Year Level <span style={{ color: c.accent }}>*</span>
                    </label>
                    <select
                      name="yearLevel"
                      value={formData.yearLevel}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 appearance-none cursor-pointer"
                      style={{
                        border: `1px solid ${c.rule}`,
                        backgroundColor: c.surface,
                        color: c.text,
                        fontFamily: "'Arian-light', sans-serif",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: `border-color ${motion.fast}`,
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = c.rule)}
                      required
                    >
                      <option value="">Select Year Level</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <FieldGroup
                    label="Section"
                    name="section"
                    type="text"
                    value={formData.section}
                    onChange={handleChange}
                    placeholder="e.g. BSCS 3-1"
                  />
                  <FieldGroup
                    label="Degree Program"
                    name="degreeProgram"
                    type="text"
                    value={formData.degreeProgram}
                    onChange={handleChange}
                    placeholder="e.g. BS Computer Science"
                  />
                </div>
              )}

              {/* Step 4: Professor */}
              {step === 4 && (
                <div className="space-y-4">
                  <FieldGroup
                    label="Professor"
                    name="professor"
                    type="text"
                    value={formData.professor}
                    onChange={handleChange}
                    placeholder="e.g. Prof. Juan Santos"
                  />
                </div>
              )}

              {/* Step 5: Review & Confirm */}
              {step === 5 && (
                <div className="space-y-3">
                  <p className="mb-3" style={{ ...LABEL_STYLE, color: c.faint }}>
                    Please review your details
                  </p>
                  <ReviewRow
                    label="Student Number"
                    value={formData.studentNumber}
                  />
                  <ReviewRow label="Full Name" value={formData.fullName} />
                  <ReviewRow label="School Email" value={formData.schoolEmail} />
                  <ReviewRow
                    label="Contact Number"
                    value={formData.contactNumber}
                  />
                  <ReviewRow
                    label="Facebook Link"
                    value={formData.facebookLink}
                  />
                  <ReviewRow
                    label="Year Level"
                    value={
                      formData.yearLevel
                        ? `${formData.yearLevel}${["st", "nd", "rd", "th"][Math.min(Number(formData.yearLevel) - 1, 3)]} Year`
                        : "—"
                    }
                  />
                  <ReviewRow label="Section" value={formData.section} />
                  <ReviewRow
                    label="Degree Program"
                    value={formData.degreeProgram}
                  />
                  <ReviewRow label="Professor" value={formData.professor} />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 pb-2">
                <p
                  className="px-3 py-2"
                  style={{
                    fontFamily: "'Arian-light', sans-serif",
                    fontSize: "0.875rem",
                    color: c.danger,
                    backgroundColor: c.dangerWash,
                    border: `1px solid ${c.danger}`,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderTop: `1px solid ${c.rule}` }}
            >
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 cursor-pointer"
                  style={{
                    fontFamily: "'Arian-bold', sans-serif",
                    fontSize: "0.875rem",
                    color: c.muted,
                    backgroundColor: "transparent",
                    border: "none",
                    transition: `color ${motion.fast}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = c.muted)}
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-5 py-2 cursor-pointer"
                  style={{
                    fontFamily: "'Arian-bold', sans-serif",
                    fontSize: "0.875rem",
                    backgroundColor: c.text,
                    color: c.surface,
                    border: "none",
                    transition: `opacity ${motion.fast}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 cursor-pointer"
                  style={{
                    fontFamily: "'Arian-bold', sans-serif",
                    fontSize: "0.875rem",
                    backgroundColor: c.accent,
                    color: "#ffffff",
                    border: "none",
                    opacity: loading ? 0.5 : 1,
                    transition: `background-color ${motion.fast}`,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = c.accentHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = c.accent)
                  }
                >
                  {loading ? "Submitting..." : "Submit Registration"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─── Reusable Field Component ─── */

function FieldGroup({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const { c } = useDS();
  return (
    <div>
      <label className="block mb-1.5" style={{ ...LABEL_STYLE, color: c.muted }}>
        {label} {required && <span style={{ color: c.accent }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5"
        style={{
          border: `1px solid ${c.rule}`,
          backgroundColor: c.surface,
          color: c.text,
          fontFamily: "'Arian-light', sans-serif",
          fontSize: "0.875rem",
          outline: "none",
          transition: `border-color ${motion.fast}`,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = c.accent)}
        onBlur={(e) => (e.currentTarget.style.borderColor = c.rule)}
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { c } = useDS();
  return (
    <div
      className="flex items-start justify-between py-1.5"
      style={{ borderBottom: `1px solid ${c.rule}` }}
    >
      <span style={{ ...LABEL_STYLE, color: c.faint }}>{label}</span>
      <span
        className="text-right max-w-[60%] break-words"
        style={{
          fontFamily: "'Arian-light', sans-serif",
          fontSize: "0.875rem",
          color: c.text,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

export default RegistrationModal;
