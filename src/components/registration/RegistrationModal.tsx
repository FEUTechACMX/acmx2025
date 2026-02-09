"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { registerForEvent } from "@/app/actions/registration";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

interface FormData {
  eventId: string;
  studentNumber: string; // 🔹 mapped to DB
  fullName: string;
  schoolEmail: string;
  contactNumber: string;
  facebookLink: string;
  yearLevel: string;
  section: string;
  professor: string;
  degreeProgram: string;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  eventId,
}) => {
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
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const serverFormData = new FormData();
      serverFormData.set("eventId", formData.eventId);
      serverFormData.set("studentNumber", formData.studentNumber);
      serverFormData.set("fullName", formData.fullName);
      serverFormData.set("schoolEmail", formData.schoolEmail);
      serverFormData.set("contactNumber", formData.contactNumber);
      serverFormData.set("facebookLink", formData.facebookLink);
      serverFormData.set("yearLevel", formData.yearLevel);
      serverFormData.set("section", formData.section);
      serverFormData.set("professor", formData.professor);
      serverFormData.set("degreeProgram", formData.degreeProgram);

      const result = await registerForEvent(serverFormData);

      if (!result.success) {
        setError(result.error || "Something went wrong while starting the payment.");
        return;
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError("Something went wrong while starting the payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-11/12 relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-3 text-xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="studentNumber"
            placeholder="Student Number"
            value={formData.studentNumber}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="email"
            name="schoolEmail"
            placeholder="School Email"
            value={formData.schoolEmail}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="url"
            name="facebookLink"
            placeholder="Facebook Link"
            value={formData.facebookLink}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <select
            name="yearLevel"
            value={formData.yearLevel}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Year Level</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          <input
            type="text"
            name="section"
            placeholder="Section"
            value={formData.section}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="professor"
            placeholder="Professor"
            value={formData.professor}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="degreeProgram"
            placeholder="Degree Program"
            value={formData.degreeProgram}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded mt-3 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;
