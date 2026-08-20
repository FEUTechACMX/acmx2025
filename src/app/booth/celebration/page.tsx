"use client";

import React, { useEffect, useRef, useState } from "react";
import { Surface, Display, Body, useDS } from "@/components/ds";
import { layout } from "@/styles/design-system";

export default function BoothCelebrationPage() {
  const { c } = useDS();
  const [count, setCount] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const last = useRef(0);

  useEffect(() => {
    const es = new EventSource("/api/booth/live/stream");
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as { count: number; recentFirstNames: string[] };
      setCount(data.count);
      setNames(data.recentFirstNames);
      if (data.count > 0 && data.count % 20 === 0 && data.count !== last.current) {
        last.current = data.count;
        setCelebrate(data.recentFirstNames[0] ?? "friend");
        window.setTimeout(() => setCelebrate(null), 10_000);
      }
    };
    return () => es.close();
  }, []);

  return (
    <Surface corners="both">
      <div
        className="flex flex-col items-center justify-center min-h-[100dvh]"
        style={{ padding: layout.gutter, gap: layout.gap, textAlign: "center" }}
      >
        {celebrate ? (
          <>
            <Display>
              {count}TH
              <br />
              MEMBER
            </Display>
            <Body>Welcome, {celebrate}.</Body>
          </>
        ) : (
          <>
            <Display>{count}</Display>
            <Body>registrations at the booth</Body>
            <Body small>{names.slice(0, 5).join(" · ")}</Body>
          </>
        )}
        <span style={{ width: 44, height: 2, background: c.accent }} />
      </div>
    </Surface>
  );
}
