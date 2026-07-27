"use client";

import React, { useMemo, useState } from "react";
import { Surface, Column, Eyebrow, Title, Rule, Body, Label, useDS } from "@/components/ds";
import { type as t, layout, motion } from "@/styles/design-system";
import Icon from "@/components/admin/icons";
import type { CommitteeSummaryDTO } from "@/types/committee";
import CommitteeCard from "./CommitteeCard";

type Filter = "ALL" | "RECRUITING" | "FULL";

/**
 * /committee — the index. The grid is whatever admins have published; the
 * header counts are summed from it rather than typed in, so they can't drift.
 */
export default function CommitteeIndex({ committees }: { committees: CommitteeSummaryDTO[] }) {
  const { c } = useDS();
  const [filter, setFilter] = useState<Filter>("ALL");

  const totals = useMemo(
    () => ({
      members: committees.reduce((n, x) => n + x.memberCount, 0),
      seats: committees.reduce((n, x) => n + (x.recruiting === "RECRUITING" ? x.openSeats : 0), 0),
    }),
    [committees]
  );

  // A chip nobody can click into is a dead end — offer only states that exist.
  const liveFilters = useMemo(() => {
    const list: Filter[] = ["ALL"];
    if (committees.some((x) => x.recruiting === "RECRUITING")) list.push("RECRUITING");
    if (committees.some((x) => x.recruiting !== "RECRUITING")) list.push("FULL");
    return list.length > 2 ? list : ["ALL" as Filter];
  }, [committees]);

  const shown = useMemo(() => {
    if (filter === "RECRUITING") return committees.filter((x) => x.recruiting === "RECRUITING");
    if (filter === "FULL") return committees.filter((x) => x.recruiting !== "RECRUITING");
    return committees;
  }, [committees, filter]);

  return (
    <Surface corners="bottom-right">
      <Column reveal={false}>
        <header>
          <Eyebrow words={["THE", "PEOPLE", "BEHIND", "ACM"]} />
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_25rem] items-end"
            style={{ paddingTop: "0.75rem", gap: "clamp(1.5rem, 4vw, 3.75rem)" }}
          >
            <Title>COMMITTEES</Title>
            <div className="flex flex-col" style={{ gap: 18 }}>
              <Body small measure={false}>
                Committees carry the chapter&apos;s work between events. Each one owns a lane, keeps
                its own roster, and opens seats each term.
              </Body>
              <div
                className="flex flex-wrap"
                style={{ gap: 40, paddingTop: 16, borderTop: `1px solid ${c.rule}` }}
              >
                <Stat label="Committees" value={pad(committees.length)} />
                <Stat label="Members" value={pad(totals.members)} />
                <Stat label="Open seats" value={pad(totals.seats)} />
              </div>
            </div>
          </div>
          <Rule margin="1.25rem 0 0" />
        </header>

        {liveFilters.length > 1 && (
          <div
            className="flex flex-wrap items-center justify-between"
            style={{
              gap: 24,
              marginTop: layout.gap,
              paddingBottom: 18,
              borderBottom: `1px solid ${c.rule}`,
            }}
          >
            <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
              {liveFilters.map((f) => (
                <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                  {f === "ALL" ? "All" : f === "RECRUITING" ? "Recruiting" : "Full"}
                </Chip>
              ))}
            </div>
            <Label color={c.faint}>
              Showing {shown.length} of {committees.length}
            </Label>
          </div>
        )}

        <div style={{ marginTop: `calc(${layout.gap} * 1.5)` }}>
          {shown.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{
                gap: 12,
                padding: "clamp(3rem, 10vh, 6rem) 1rem",
                border: `1px solid ${c.rule}`,
                color: c.faint,
              }}
            >
              <Icon name="committees" size={32} />
              <Label color={c.muted}>Nothing published yet</Label>
              <Body small measure={false}>
                {committees.length === 0
                  ? "No committee has been added. This page fills itself the moment one is published."
                  : "No committee matches that filter."}
              </Body>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gap: "clamp(1.25rem, 2vw, 1.5rem)",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 20rem), 1fr))",
              }}
            >
              {shown.map((committee) => (
                <CommitteeCard
                  key={committee.id}
                  committee={committee}
                  // Numbering follows the published order, not the filtered view.
                  index={committees.findIndex((x) => x.id === committee.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Column>
    </Surface>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function Stat({ label, value }: { label: string; value: string }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 5 }}>
      <span style={{ ...t.label, color: c.faint }}>{label}</span>
      <span style={{ ...t.mono, color: c.text }}>{value}</span>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <button
      onClick={onClick}
      style={{
        ...t.label,
        padding: "8px 14px",
        cursor: "pointer",
        borderRadius: 0,
        color: active ? "#ffffff" : c.muted,
        backgroundColor: active ? c.accent : "transparent",
        border: `1px solid ${active ? c.accent : c.rule}`,
        transition: `background-color ${motion.fast}, color ${motion.fast}`,
      }}
    >
      {children}
    </button>
  );
}
