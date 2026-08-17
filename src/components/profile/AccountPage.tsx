"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { roleLabel } from "@/types/auth";
import Surface, { Column } from "@/components/ds/Surface";
import { useDS, Badge } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import { runBlinkIn } from "@/lib/blink";
import ChangePasswordModal from "./ChangePasswordModal";
import OverviewTab from "./OverviewTab";
import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";
import { StatBlock, ordinalYear, type ProfileData, type AccountDetails } from "./shared";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "account", label: "Account" },
  { key: "security", label: "Security" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTab(value: string | null): value is TabKey {
  return TABS.some((tab) => tab.key === value);
}

/**
 * The member's account, all of it — what used to be /profile and /settings.
 *
 * The masthead and stat rail are fixed; only the region under the tab rule
 * swaps. Tabs are state, not routes, so switching costs no navigation and no
 * refetch, but the choice is mirrored into `?tab=` so a link can open straight
 * onto Security and a refresh lands where you left off.
 */
export default function AccountPage({ user }: { user: safeUser }) {
  const { c } = useDS();
  const router = useRouter();
  const params = useSearchParams();

  const requested = params.get("tab");
  const [tab, setTab] = useState<TabKey>(isTab(requested) ? requested : "overview");
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const res = await fetch("/api/profile", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error("request failed");
      setData(json);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // `load`'s setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Keep the URL honest without pushing history entries for a tab click.
  const selectTab = (next: TabKey) => {
    setTab(next);
    const query = next === "overview" ? "" : `?tab=${next}`;
    router.replace(`/profile${query}`, { scroll: false });
  };

  // Follow the URL when it changes underneath us — the back button, or a link
  // into a specific tab. Compared against the previous `?tab=` rather than
  // against `tab` itself, so a click that sets the tab and then rewrites the
  // URL doesn't bounce back through here.
  const [prevRequested, setPrevRequested] = useState(requested);
  if (requested !== prevRequested) {
    setPrevRequested(requested);
    if (isTab(requested)) setTab(requested);
  }

  const panelRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelRef.current) return;
    runBlinkIn(panelRef.current.children, { stagger: 0.12 });
  }, [tab, loading]);

  const applyAccountPatch = (patch: Partial<AccountDetails>) => {
    setData((prev) => (prev ? { ...prev, account: { ...prev.account, ...patch } } : prev));
  };

  const logOut = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";
  const account = data?.account ?? null;

  return (
    <Surface>
      <Column reveal={false}>
        {/* Masthead */}
        <header className="flex flex-col" style={{ gap: "1.6rem" }}>
          <span style={{ ...t.eyebrow, color: c.faint, textTransform: "uppercase" }}>
            Account / {TABS.find((x) => x.key === tab)?.label}
          </span>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between" style={{ gap: "1.5rem" }}>
            <div className="flex items-center" style={{ gap: "1.4rem" }}>
              <span
                className="flex items-center justify-center shrink-0"
                aria-hidden="true"
                style={{
                  width: "clamp(3.5rem, 7vw, 5.5rem)",
                  height: "clamp(3.5rem, 7vw, 5.5rem)",
                  ...t.heading,
                  color: c.accent,
                  backgroundColor: c.accentWash,
                  border: `1px solid ${c.accent}`,
                }}
              >
                {initial}
              </span>

              <div className="flex flex-col min-w-0" style={{ gap: "0.6rem" }}>
                <h1 style={{ ...t.title, fontSize: "clamp(1.6rem, 3.6vw, 2.75rem)", color: c.text, margin: 0 }}>
                  {user?.name}
                </h1>
                <div className="flex flex-wrap items-center" style={{ gap: "0.85rem" }}>
                  <span style={{ ...t.mono, color: c.muted }}>{user?.email}</span>
                  <span style={{ width: 1, height: "0.7rem", backgroundColor: c.rule }} />
                  <span style={{ ...t.mono, color: c.muted }}>{user?.studentId}</span>
                  {account && (
                    <>
                      <span style={{ width: 1, height: "0.7rem", backgroundColor: c.rule }} />
                      <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
                        {account.degreeProgram} · {ordinalYear(account.yearLevel)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end" style={{ gap: "0.7rem" }}>
              <Badge tone="accent">{roleLabel(user?.role)}</Badge>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav
          className="flex"
          style={{ gap: "2rem", marginTop: "2rem", borderBottom: `1px solid ${c.rule}` }}
        >
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <button
                key={item.key}
                onClick={() => selectTab(item.key)}
                aria-current={active ? "page" : undefined}
                style={{
                  ...t.label,
                  textTransform: "uppercase",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${active ? c.accent : "transparent"}`,
                  color: active ? c.text : c.muted,
                  padding: "0 0 0.85rem",
                  cursor: "pointer",
                  transition: `color ${motion.fast}, border-color ${motion.fast}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Stat rail */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3"
          style={{
            gap: "1.5rem",
            padding: "2rem 0",
            borderBottom: `1px solid ${c.rule}`,
          }}
        >
          <StatBlock value={user?.points ?? 0} label="Points" />
          <StatBlock
            value={data?.stats.eventsAttended ?? "—"}
            label="Events attended"
            loading={loading}
          />
          <StatBlock
            value={data?.stats.totalRegistrations ?? "—"}
            label="Registrations"
            loading={loading}
          />
        </div>

        {failed && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4"
            style={{
              marginTop: "1.5rem",
              padding: "0.9rem 1.15rem",
              backgroundColor: c.dangerWash,
              border: `1px solid ${c.danger}`,
              ...t.bodySmall,
              color: c.danger,
            }}
          >
            Couldn&apos;t load your profile data.
            <button
              onClick={load}
              style={{
                ...t.label,
                textTransform: "uppercase",
                background: "transparent",
                border: `1px solid ${c.danger}`,
                color: c.danger,
                padding: "0.4rem 0.9rem",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={panelRef} style={{ marginTop: "2.5rem" }}>
          {tab === "overview" && (
            <OverviewTab
              data={data}
              loading={loading}
              onChangePassword={() => setModalOpen(true)}
              onEditAccount={() => selectTab("account")}
              onLogOut={logOut}
            />
          )}
          {tab === "account" && (
            <AccountTab account={account} loading={loading} onSaved={applyAccountPatch} />
          )}
          {tab === "security" && (
            <SecurityTab
              sessions={data?.sessions ?? []}
              loading={loading}
              onChangePassword={() => setModalOpen(true)}
              onSessionsChanged={load}
            />
          )}
        </div>
      </Column>

      <ChangePasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        email={user?.email}
      />
    </Surface>
  );
}
