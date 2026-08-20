"use client";

import React, { useEffect, useState } from "react";
import { Surface, Display, useDS } from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";

export default function BoothWallPage() {
  const { c } = useDS();
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/booth/live/stream");
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as { recentFirstNames: string[] };
      setNames(data.recentFirstNames);
    };
    return () => es.close();
  }, []);

  return (
    <Surface corners="both">
      <div
        className="flex flex-col min-h-[100dvh]"
        style={{ padding: layout.gutter, gap: layout.gap }}
      >
        <Display>WELCOME</Display>
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          {names.map((name, i) => (
            <span
              key={`${name}-${i}`}
              style={{
                ...t.heading,
                color: c.text,
                border: `1px solid ${c.rule}`,
                padding: "1rem",
                backgroundColor: c.panel,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </Surface>
  );
}
