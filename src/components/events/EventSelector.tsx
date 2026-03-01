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
    <div className="flex justify-center mb-8 sm:mb-10">
      <div className="inline-flex items-center bg-white border border-gray-200 p-1">
        {["1st", "2nd", "3rd"].map((sem) => (
          <button
            key={sem}
            onClick={() => handleSelect(sem)}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-['Arian-bold'] text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              selected === sem
                ? "bg-[#E4BCF3] text-black shadow-sm border border-gray-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {sem} Semester
          </button>
        ))}
      </div>
    </div>
  );
}
