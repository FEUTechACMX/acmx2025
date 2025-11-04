"use client";

import React, { useState } from "react";

interface EventSelectorProps {
  onChange: (semester: string) => void;
}

export default function EventSelector({ onChange }: EventSelectorProps) {
  const [selected, setSelected] = useState("1st");

  const handleSelect = (semester: string) => {
    setSelected(semester);
    onChange(semester);
  };

  return (
    <div className="flex justify-center mb-10">
      <div className="inline-flex items-center rounded-lg bg-white border p-1">
        {["1st", "2nd", "3rd"].map((sem) => (
          <button
            key={sem}
            onClick={() => handleSelect(sem)}
            className={`px-6 py-3 font-['Arapey'] rounded-md text-sm font-medium transition-colors cursor-pointer ${
              selected === sem
                ? "bg-[#E4BCF3] text-black shadow border"
                : "text-black hover:bg-gray-700"
            }`}
          >
            {sem} Semester
          </button>
        ))}
      </div>
    </div>
  );
}
