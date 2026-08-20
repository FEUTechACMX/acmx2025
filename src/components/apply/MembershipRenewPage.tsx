"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Surface,
  Column,
  PageHeader,
  Panel,
  Button,
  Segmented,
  Body,
  DataRow,
  useDS,
} from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import {
  BUNDLE_SIZE,
  type BundleKindValue,
  type MembershipPersonInput,
} from "@/lib/membership";
import type { safeUser } from "@/types/auth";
import ProofUpload from "./ProofUpload";
import { emptyPerson, PersonFields } from "./PersonFields";

const BUNDLE_OPTIONS: { value: BundleKindValue; label: string }[] = [
  { value: "SOLO", label: "Solo" },
  { value: "PARTNER", label: "Partner" },
  { value: "BUNDLE_5", label: "Bundle 5" },
  { value: "BUNDLE_8", label: "Bundle 8" },
];

function errorsFor(prefix: string, errors: Record<string, string | undefined>) {
  const out: Record<string, string | undefined> = {};
  const head = `${prefix}.`;
  for (const [k, v] of Object.entries(errors)) {
    if (k.startsWith(head)) out[k.slice(head.length)] = v;
  }
  return out;
}

export default function MembershipRenewPage({ user }: { user: NonNullable<safeUser> }) {
  const { c } = useDS();
  const router = useRouter();
  const [bundle, setBundle] = useState<BundleKindValue>("SOLO");
  const [teammates, setTeammates] = useState<MembershipPersonInput[]>([]);
  const [proofStorageKey, setProof] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const extra = BUNDLE_SIZE[bundle] - 1;
  const sized = useMemo(() => {
    const next = teammates.slice(0, extra);
    while (next.length < extra) next.push(emptyPerson());
    return next;
  }, [teammates, extra]);

  function setBundleKind(v: BundleKindValue) {
    setBundle(v);
    const n = BUNDLE_SIZE[v] - 1;
    setTeammates((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push(emptyPerson());
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setErrors({});
    try {
      const res = await fetch("/api/membership/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle, proofStorageKey, teammates: sized }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json.error ?? "Could not submit.");
        if (json.errors) setErrors(json.errors);
        return;
      }
      router.push("/apply/success");
    } catch {
      setFormError("Could not submit. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["MEMBERSHIP", "RENEWAL", "AY", "2026-27"]}
          title={
            <>
              RENEW
              <br />
              MEMBERSHIP
            </>
          }
          intro={
            <Body>
              You are signed in as {user.name}. Teammates on a bundle must be new people — anyone
              who already has an account should log in and renew themselves.
            </Body>
          }
        />

        <form onSubmit={submit} className="flex flex-col" style={{ gap: layout.gap, marginTop: layout.gap }}>
          <Panel>
            <div className="flex flex-col" style={{ gap: "0.75rem" }}>
              <span style={{ ...t.label, color: c.faint }}>PAYER</span>
              <DataRow label="Name" value={user.name} />
              <DataRow label="Student number" value={user.studentId} />
              <DataRow label="Email" value={user.email} />
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-col" style={{ gap: "1rem" }}>
              <span style={{ ...t.label, color: c.faint }}>BUNDLE</span>
              <Segmented options={BUNDLE_OPTIONS} value={bundle} onChange={setBundleKind} />
            </div>
          </Panel>

          {sized.map((person, i) => (
            <Panel key={i}>
              <div className="flex flex-col" style={{ gap: "1.25rem" }}>
                <span style={{ ...t.label, color: c.faint }}>NEW TEAMMATE {i + 1}</span>
                <PersonFields
                  idPrefix={`t${i}`}
                  value={person}
                  errors={errorsFor(`teammates.${i}`, errors)}
                  onChange={(next) =>
                    setTeammates(() => {
                      const copy = sized.slice();
                      copy[i] = next;
                      return copy;
                    })
                  }
                />
              </div>
            </Panel>
          ))}

          <Panel>
            <ProofUpload
              storageKey={proofStorageKey}
              onUploaded={setProof}
              error={errors.proofStorageKey}
            />
          </Panel>

          {formError && (
            <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
              {formError}
            </p>
          )}

          <Button type="submit" disabled={busy || !proofStorageKey} className="w-full sm:w-auto">
            {busy ? "Submitting…" : "Submit renewal"}
          </Button>
        </form>
      </Column>
    </Surface>
  );
}
