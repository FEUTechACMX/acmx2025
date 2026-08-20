"use client";

import React from "react";
import Link from "next/link";
import { Surface, Column, Rule, Body, Label, Button, useDS } from "@/components/ds";
import { type as t, layout, motion } from "@/styles/design-system";
import Icon from "@/components/admin/icons";
import {
  committeeNumber,
  deadlineNote,
  MEMBER_ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  RECRUITING_HEADLINES,
  type CommitteeDTO,
  type CommitteeMemberDTO,
  type CommitteeProjectStatus,
} from "@/types/committee";
import { CornerDiamonds, EmblemMark, MemberToken } from "./Diamond";

/**
 * /committee/[slug] — ONE page for every committee, present and future.
 *
 * Admins fill slots; the design owns section order, the four stat slots and the
 * type scale. That asymmetry is the point: it's what stops six committees from
 * becoming six different websites.
 *
 * Every block degrades on its own. A committee with nothing but a name still
 * renders a complete page — no roster shows the roster's empty state, no
 * current work hides that block entirely rather than printing an empty header.
 */
export default function CommitteePlate({
  committee,
  index,
}: {
  committee: CommitteeDTO;
  /** Position on the published index — drives the N° in the hero. */
  index: number;
}) {
  const { c } = useDS();
  const recruiting = committee.recruiting === "RECRUITING";

  const stats: { value: string; label: string }[] = [
    { value: pad(committee.memberCount), label: "Members" },
    { value: pad(committee.openSeats), label: "Open seats" },
    { value: pad(committee.projects.length), label: "Active projects" },
    { value: committee.formedYear ? String(committee.formedYear) : "—", label: "Formed" },
  ];

  return (
    <Surface corners="bottom-right">
      <Column reveal={false}>
        <Link href="/committee" style={{ textDecoration: "none" }}>
          <Label color={c.faint}>← All committees</Label>
        </Link>

        {/* Hero */}
        <div
          className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center"
          style={{ marginTop: 24, gap: "clamp(2rem, 5vw, 4rem)" }}
        >
          <div className="flex flex-col" style={{ gap: 18 }}>
            <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
              <Label color={c.accent}>{committeeNumber(index)}</Label>
              <span aria-hidden="true" style={{ width: 22, height: 1, backgroundColor: c.rule }} />
              {committee.kicker && <Label color={c.muted}>{committee.kicker}</Label>}
            </div>

            <h1
              style={{
                ...t.title,
                fontSize: "clamp(2.25rem, 6vw, 5rem)",
                color: c.text,
                margin: 0,
              }}
            >
              {committee.name}
            </h1>

            <span aria-hidden="true" style={{ width: 64, height: 2, backgroundColor: c.accent }} />

            {committee.mandate && (
              <Body muted style={{ maxWidth: "44rem" }}>
                {committee.mandate}
              </Body>
            )}
          </div>

          {/* Committee mark */}
          <div
            className="relative hidden lg:flex flex-col items-center justify-center shrink-0"
            style={{ gap: 16, width: 260 }}
          >
            <CornerDiamonds
              size={300}
              color={c.accent}
              className="absolute pointer-events-none"
              style={{ opacity: 0.45 }}
            />
            <EmblemMark emblem={committee.emblem} size={220} hollow />
            <Label color={c.faint}>Committee mark</Label>
          </div>
        </div>

        {/* Stats */}
        <div
          className="flex flex-wrap justify-between"
          style={{
            gap: 32,
            marginTop: `calc(${layout.gap} * 1.25)`,
            padding: "26px 0",
            borderTop: `1px solid ${c.rule}`,
            borderBottom: `1px solid ${c.rule}`,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col" style={{ gap: 10 }}>
              <span style={{ ...t.title, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", color: c.text }}>
                {s.value}
              </span>
              <span aria-hidden="true" style={{ width: 26, height: 2, backgroundColor: c.accent }} />
              <Label color={c.faint}>{s.label}</Label>
            </div>
          ))}
        </div>

        {/* Body split */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_25rem]"
          style={{ marginTop: `calc(${layout.gap} * 1.5)`, gap: "clamp(2rem, 4vw, 3rem)" }}
        >
          <div className="flex flex-col" style={{ gap: `calc(${layout.gap} * 1.25)` }}>
            {committee.responsibilities.length > 0 && (
              <section>
                <SectionLabel>What this committee owns</SectionLabel>
                <div className="flex flex-col">
                  {committee.responsibilities.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex"
                      style={{ gap: 22, padding: "18px 0", borderBottom: `1px solid ${c.rule}` }}
                    >
                      <Label color={c.accent} style={{ paddingTop: 2 }}>
                        {String(i + 1).padStart(2, "0")}
                      </Label>
                      <div className="flex flex-col" style={{ gap: 6 }}>
                        <span style={{ ...t.subheading, color: c.text }}>{r.title}</span>
                        {r.description && (
                          <Body small measure={false}>
                            {r.description}
                          </Body>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {committee.projects.length > 0 && (
              <section>
                <SectionLabel>Current work</SectionLabel>
                <div className="flex flex-col">
                  {committee.projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between flex-wrap"
                      style={{ gap: 16, padding: "16px 0", borderBottom: `1px solid ${c.rule}` }}
                    >
                      <div className="flex flex-col" style={{ gap: 5 }}>
                        <span
                          style={{ ...t.label, fontSize: "0.8125rem", letterSpacing: "0.1em", color: c.text }}
                        >
                          {p.title}
                        </span>
                        {p.meta && (
                          <span style={{ ...t.bodySmall, color: c.faint }}>{p.meta}</span>
                        )}
                      </div>
                      <ProjectPill status={p.status} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {committee.responsibilities.length === 0 && committee.projects.length === 0 && (
              <EmptyBlock
                title="Details not published"
                body="This committee has been added but its duties and current work aren't up yet."
              />
            )}
          </div>

          {/* Right rail */}
          <div className="flex flex-col" style={{ gap: 30 }}>
            <RecruitPanel committee={committee} />

            <a
              href="mailto:acmx.feu.it@gmail.com"
              className="flex items-center justify-between"
              style={{
                gap: 12,
                padding: "14px 16px",
                textDecoration: "none",
                border: `1px solid ${c.rule}`,
              }}
            >
              <div className="flex flex-col min-w-0" style={{ gap: 4 }}>
                <Label color={c.muted}>Contact ACMX</Label>
                <span style={{ ...t.bodySmall, color: c.text }}>acmx.feu.it@gmail.com</span>
              </div>
              <span style={{ color: recruiting ? c.accent : c.muted, display: "flex" }}>
                <Icon name="arrow-up-right" size={15} />
              </span>
            </a>
          </div>
        </div>

        {/* Roster */}
        <section style={{ marginTop: `calc(${layout.gap} * 2)` }}>
          <div className="flex items-end justify-between flex-wrap" style={{ gap: 16 }}>
            <Label color={c.faint}>The roster</Label>
            <Label color={c.faint}>
              {committee.memberCount === 0
                ? "Not published"
                : `${committee.memberCount} ${committee.memberCount === 1 ? "member" : "members"}`}
            </Label>
          </div>
          <Rule margin="14px 0 0" />

          {committee.members.length === 0 ? (
            <div style={{ marginTop: 28 }}>
              <EmptyBlock
                title="Roster not published"
                body="The committee exists, but no members have been assigned. Everything else on this page still stands."
              />
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 28, marginTop: 28 }}>
              {committee.leads.length > 0 && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2"
                  style={{ gap: "clamp(1rem, 2vw, 1.5rem)" }}
                >
                  {committee.leads.map((lead) => (
                    <LeadCard key={lead.id} member={lead} />
                  ))}
                </div>
              )}

              {committee.roster.length > 0 && (
                <div
                  className="grid justify-items-center"
                  style={{
                    gap: "clamp(1.25rem, 2vw, 1.75rem)",
                    gridTemplateColumns: "repeat(auto-fill, minmax(8.125rem, 1fr))",
                  }}
                >
                  {committee.roster.map((m) => (
                    <MemberToken key={m.id} member={m} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Closing band — somewhere to go other than the back button. */}
        <div
          className="flex items-center justify-between flex-wrap"
          style={{
            gap: 40,
            marginTop: `calc(${layout.gap} * 2)`,
            padding: "28px 30px",
            backgroundColor: c.panel,
            border: `1px solid ${c.ruleStrong}`,
          }}
        >
          <div className="flex flex-col" style={{ gap: 7, maxWidth: "42rem" }}>
            <span style={{ ...t.subheading, fontSize: "1.25rem", color: c.text }}>
              Not sure this is your lane?
            </span>
            <Body small measure={false}>
              Every committee posts its own call. Browse them all and apply to as many as you can
              carry — heads coordinate before anyone is doubled up.
            </Body>
          </div>
          <Link href="/committee" style={{ textDecoration: "none" }}>
            <Button variant="solid">See all committees</Button>
          </Link>
        </div>
      </Column>
    </Surface>
  );
}

/* ── Recruiting ─────────────────────────────────────────────── */

/**
 * The open call. RECRUITING is the only state that earns the accent panel —
 * on this page orchid means "you can act on this", so FULL and NOT_YET stay
 * neutral. The seat number here and the OPEN SEATS stat read the same
 * reconciled field, so they cannot disagree.
 */
function RecruitPanel({ committee }: { committee: CommitteeDTO }) {
  const { c } = useDS();
  const live = committee.recruiting === "RECRUITING";
  const edge = live ? c.accent : c.rule;
  const deadline = deadlineNote(committee.recruiting, committee.callDeadline);

  const headline = live
    ? `${committee.openSeats} ${committee.openSeats === 1 ? "seat" : "seats"} open this term`
    : committee.recruiting === "FULL"
      ? "No open seats right now"
      : "Not taking applications yet";

  const fallback = live
    ? "Applications are open. Tell us which lane you want and why."
    : committee.recruiting === "FULL"
      ? "Every seat is filled for this term. Join the waitlist and you'll be first to hear about the next call."
      : "This committee is still being staffed. Details land here once they're published.";

  const cta = "Become a member";

  return (
    <div
      className="flex flex-col"
      style={{
        gap: 14,
        padding: 22,
        backgroundColor: live ? c.accentWash : c.panel,
        border: `1px solid ${edge}`,
      }}
    >
      <Label color={live ? c.accent : c.muted}>{RECRUITING_HEADLINES[committee.recruiting]}</Label>
      <span style={{ ...t.subheading, fontSize: "1.125rem", color: c.text }}>{headline}</span>
      <Body small measure={false}>
        {committee.callBody || fallback}
      </Body>

      <Link href="/apply/membership" style={{ textDecoration: "none" }}>
        <Button variant={live ? "solid" : "ghost"} block>
          {cta}
        </Button>
      </Link>

      {deadline && <Label color={c.faint}>{deadline}</Label>}
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────── */

function LeadCard({ member }: { member: CommitteeMemberDTO }) {
  const { c } = useDS();
  return (
    <div
      className="flex items-center"
      style={{ gap: 20, padding: 22, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}
    >
      <MemberToken member={member} size={92} caption={false} />
      <div className="flex flex-col" style={{ gap: 7 }}>
        <Label color={c.accent}>
          {MEMBER_ROLE_LABELS[member.position]}
          {member.roleLabel ? ` · ${member.roleLabel}` : ""}
        </Label>
        <span style={{ ...t.subheading, fontSize: "1.1875rem", color: c.text }}>{member.name}</span>
        {member.bio && (
          <Body small measure={false}>
            {member.bio}
          </Body>
        )}
      </div>
    </div>
  );
}

function ProjectPill({ status }: { status: CommitteeProjectStatus }) {
  const { c } = useDS();
  const tones: Record<CommitteeProjectStatus, { fg: string; bg: string }> = {
    IN_PROGRESS: { fg: c.accent, bg: c.accentWash },
    REVIEW: { fg: c.muted, bg: c.panel },
    SHIPPED: { fg: c.positive, bg: c.positiveWash },
  };
  const tone = tones[status];

  return (
    <span
      style={{
        ...t.label,
        fontSize: "0.625rem",
        padding: "5px 11px",
        whiteSpace: "nowrap",
        color: tone.fg,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.fg}`,
      }}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 9, marginBottom: 8 }}>
      <Label color={c.faint}>{children}</Label>
      <span aria-hidden="true" style={{ height: 1, backgroundColor: c.rule }} />
    </div>
  );
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  const { c } = useDS();
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        gap: 12,
        padding: "clamp(2.5rem, 6vh, 3.5rem) 1.5rem",
        backgroundColor: c.panel,
        border: `1px solid ${c.rule}`,
      }}
    >
      <svg width={54} height={54} viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 2 L98 50 L50 98 L2 50 Z" fill="none" stroke={c.rule} strokeWidth={1} />
      </svg>
      <Label color={c.muted}>{title}</Label>
      <Body small measure={false} style={{ maxWidth: "24rem", transition: `color ${motion.fast}` }}>
        {body}
      </Body>
    </div>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
