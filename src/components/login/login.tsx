"use client";

import { useState } from "react";
import Link from "next/link";
import { Surface, Column, PageHeader, Panel, Button, Field, Label, useDS } from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";

export default function LoginPage({ membershipOpen = false }: { membershipOpen?: boolean }) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { c } = useDS();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || data.error || "Login failed");
      } else {
        // Full document load, not router.push — the session is cached per
        // document in `sessionClient`, so the nav has to start fresh to see it.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["MEMBERS", "ONLY"]}
          title="SIGN IN"
          intro="Enter your student number and ACMX password."
        />

        <Panel style={{ marginTop: `calc(${layout.gap} * 1.5)`, maxWidth: "28rem", width: "100%" }}>
          <form onSubmit={handleLogin} className="flex flex-col" style={{ gap: layout.gap }}>
            <Field
              id="studentId"
              label="Student Number"
              placeholder="e.g. 202512345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              autoComplete="username"
            />

            <Field
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="flex flex-col" style={{ gap: "0.45rem" }}>
              <Link
                href="/account/claim-account"
                style={{ ...t.bodySmall, color: c.accent, textDecoration: "none" }}
              >
                First time signing in? Claim your account
              </Link>
              <Link
                href="/account/reset-password"
                style={{ ...t.bodySmall, color: c.accent, textDecoration: "none" }}
              >
                Forgot password?
              </Link>
              {membershipOpen && (
                <Link
                  href="/apply/membership"
                  style={{ ...t.bodySmall, color: c.muted, textDecoration: "none" }}
                >
                  Not a member yet? Become a member
                </Link>
              )}
            </div>

            {error && (
              <div style={{ borderLeft: `2px solid ${c.accent}`, paddingLeft: "0.75rem" }}>
                <Label style={{ color: c.accent }}>{error}</Label>
              </div>
            )}

            <Button type="submit" disabled={loading} block>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </Panel>
      </Column>
    </Surface>
  );
}
