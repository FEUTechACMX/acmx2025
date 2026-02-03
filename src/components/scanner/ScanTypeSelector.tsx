"use client";

import React from "react";
import { ScanType } from "@/types/scantTypes";

type ScanTypeSelectorProps = {
  value: ScanType;
  onChange: (type: ScanType) => void;
  disabled?: boolean;
};

const scanTypes: { value: ScanType; label: string }[] = [
  { value: "UserVerification", label: "Verify User" },
  { value: "TimeIn", label: "Time In" },
  { value: "TimeOut", label: "Time Out" },
  { value: "Payment", label: "Payment" },
];

export default function ScanTypeSelector({
  value,
  onChange,
  disabled = false,
}: ScanTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-white/60 text-xs uppercase tracking-wider font-['supermolot']">
        Scan Mode
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ScanType)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 appearance-none cursor-pointer
            bg-white text-black
            border-2 border-[#CD78EC]/30
            font-['supermolot'] text-sm uppercase tracking-wider
            focus:outline-none focus:border-[#CD78EC]
            transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {scanTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {/* Dropdown arrow */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg
            className="w-4 h-4 text-[#CD78EC]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
