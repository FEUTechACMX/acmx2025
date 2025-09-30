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
    <div className="flex gap-4 mb-6">
      {["1st", "2nd", "3rd"].map((sem) => (
        <button
          key={sem}
          onClick={() => handleSelect(sem)}
          className={`px-4 py-2 rounded-lg ${
            selected === sem
              ? "bg-white text-black font-bold"
              : "bg-gray-800 text-white"
          }`}
        >
          {sem} Semester
        </button>
      ))}
    </div>
  );
}
