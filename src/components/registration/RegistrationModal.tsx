"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface FormData {
  eventId: string;
  userId: string;
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

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  eventId,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    eventId,
    userId: "",
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Auto-fill for logged-in users
  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setError(null);

    async function prefill() {
      setPrefilling(true);
      try {
        const res = await fetch("/api/registration-prefill");
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            userId: data.userId || "",
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
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setPrefilling(false);
      }
    }

    prefill();
  }, [isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    if (!formData.studentNumber || !formData.fullName || !formData.schoolEmail || !formData.yearLevel) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // Build payload — only include userId if logged in
      const payload = {
        ...formData,
        userId: isLoggedIn ? formData.userId : undefined,
      };

      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      onClose();
      alert("Successfully registered!");
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
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
          <h2 className="text-lg font-['Arian-bold'] text-gray-900 tracking-tight">
            Event Registration
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 6l12 12M6 18L18 6" />
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
                    className={`w-7 h-7 flex items-center justify-center text-xs font-['Arian-bold'] transition-colors ${
                      isActive
                        ? "bg-[#CF78EC] text-white"
                        : isComplete
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-['Arian-light'] ${
                      isActive ? "text-[#CF78EC]" : isComplete ? "text-gray-900" : "text-gray-300"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-[2px] bg-gray-100 relative">
            <div
              className="absolute top-0 left-0 h-full bg-[#CF78EC] transition-all duration-300"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Loading state for prefill */}
        {prefilling ? (
          <div className="px-6 py-16 flex flex-col items-center justify-center">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-[#CF78EC] animate-spin mb-3" />
            <p className="text-sm text-gray-400 font-['Arian-light']">Loading your details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
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
                    <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">
                      Year Level <span className="text-[#CF78EC]">*</span>
                    </label>
                    <select
                      name="yearLevel"
                      value={formData.yearLevel}
                      onChange={handleChange}
                      className="w-full border border-gray-200 px-3 py-2.5 text-sm font-['Arian-light'] text-gray-900 bg-white focus:outline-none focus:border-[#CF78EC] transition-colors appearance-none cursor-pointer"
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
                  <p className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-wider mb-3">
                    Please review your details
                  </p>
                  <ReviewRow label="Student Number" value={formData.studentNumber} />
                  <ReviewRow label="Full Name" value={formData.fullName} />
                  <ReviewRow label="School Email" value={formData.schoolEmail} />
                  <ReviewRow label="Contact Number" value={formData.contactNumber} />
                  <ReviewRow label="Facebook Link" value={formData.facebookLink} />
                  <ReviewRow label="Year Level" value={formData.yearLevel ? `${formData.yearLevel}${["st","nd","rd","th"][Math.min(Number(formData.yearLevel)-1,3)]} Year` : "—"} />
                  <ReviewRow label="Section" value={formData.section} />
                  <ReviewRow label="Degree Program" value={formData.degreeProgram} />
                  <ReviewRow label="Professor" value={formData.professor} />
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 pb-2">
                <p className="text-sm text-red-600 font-['Arian-light'] bg-red-50 border border-red-100 px-3 py-2">
                  {error}
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 text-sm font-['Arian-bold'] text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
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
                  className="px-5 py-2 text-sm font-['Arian-bold'] bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-['Arian-bold'] bg-[#CF78EC] text-white hover:bg-[#b560d4] transition-colors disabled:opacity-50 cursor-pointer"
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
  return (
    <div>
      <label className="block text-xs font-['Arian-bold'] text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-[#CF78EC]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-200 px-3 py-2.5 text-sm font-['Arian-light'] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#CF78EC] transition-colors"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-50">
      <span className="text-xs font-['Arian-bold'] text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-['Arian-light'] text-gray-900 text-right max-w-[60%] break-words">
        {value || "—"}
      </span>
    </div>
  );
}

export default RegistrationModal;
