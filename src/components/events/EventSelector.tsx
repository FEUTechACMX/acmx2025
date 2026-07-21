"use client";

import React, { useState } from "react";
import { Segmented } from "@/components/ds";

const SEMESTERS = [
  { value: "1st", label: "1st Sem" },
  { value: "2nd", label: "2nd Sem" },
  { value: "3rd", label: "3rd Sem" },
] as const;

interface EventSelectorProps {
  onChange: (semester: string) => void;
}

export default function EventSelector({ onChange }: EventSelectorProps) {
  const [selected, setSelected] = useState<string>("2nd");

  return (
    <Segmented
      options={SEMESTERS}
      value={selected}
      onChange={(v) => {
        setSelected(v);
        onChange(v);
      }}
    />
  );
}
