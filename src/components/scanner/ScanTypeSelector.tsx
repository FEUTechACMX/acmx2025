import React from "react";
import { ScanType } from "@/types/scantTypes";

type ScanTypeSelectorProps = {
  value: ScanType;
  onChange: (type: ScanType) => void;
};

function ScanTypeSelector({ value, onChange }: ScanTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ScanType)}
      className="border p-1"
    >
      <option value="UserVerification">Verify User</option>
      <option value="TimeIn">Time In</option>
      <option value="TimeOut">Time Out</option>
    </select>
  );
}

export default ScanTypeSelector;
