"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Surface,
  Column,
  PageHeader,
  Panel,
  Button,
  Segmented,
  Body,
  useDS,
} from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import {
  BUNDLE_SIZE,
  type BundleKindValue,
  type MembershipPersonInput,
} from "@/lib/membership";
import { MEMBERSHIP_PRICE, formatPeso } from "@/lib/pricing";
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

export default function MembershipApplyPage() {
  const { c } = useDS();
  const router = useRouter();
  const [bundle, setBundle] = useState<BundleKindValue>("SOLO");
  const [members, setMembers] = useState<MembershipPersonInput[]>([emptyPerson()]);
  const [proofStorageKey, setProof] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const size = BUNDLE_SIZE[bundle];
  const newPrice = MEMBERSHIP_PRICE.NEW[bundle];
  const sizedMembers = useMemo(() => {
    const next = members.slice(0, size);
    while (next.length < size) next.push(emptyPerson());
    return next;
  }, [members, size]);

  function setBundleKind(v: BundleKindValue) {
    setBundle(v);
    const n = BUNDLE_SIZE[v];
    setMembers((prev) => {
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
      const res = await fetch("/api/membership/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle, proofStorageKey, members: sizedMembers }),
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
        <Link
          href="/login"
          className="flex items-center justify-between"
          style={{
            gap: "1rem",
            padding: "0.9rem 1.1rem",
            backgroundColor: c.accentWash,
            border: `1px solid ${c.rule}`,
            borderLeft: `3px solid ${c.accent}`,
            color: c.text,
            textDecoration: "none",
            marginBottom: layout.gap,
          }}
        >
          <span style={{ ...t.body, color: c.text, margin: 0 }}>
            Already a member? Renew here →
          </span>
          <span style={{ ...t.label, color: c.accent }}>LOGIN</span>
        </Link>

        <PageHeader
          eyebrow={["MEMBERSHIP", "DRIVE", "AY", "2026-27"]}
          title={
            <>
              BECOME
              <br />
              A MEMBER
            </>
          }
          intro={
            <Body>
              New applicants only. An officer reviews your proof of payment before you can sign
              in.
            </Body>
          }
        />

        <form onSubmit={submit} className="flex flex-col" style={{ gap: layout.gap, marginTop: layout.gap }}>
          <Panel>
            <div className="flex flex-col" style={{ gap: "1rem" }}>
              <span style={{ ...t.label, color: c.faint }}>BUNDLE</span>
              <Segmented options={BUNDLE_OPTIONS} value={bundle} onChange={setBundleKind} />
              <div
                className="flex flex-col"
                style={{
                  gap: "0.35rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: c.accentWash,
                  border: `1px solid ${c.rule}`,
                  borderLeft: `3px solid ${c.accent}`,
                }}
              >
                <span style={{ ...t.label, color: c.faint }}>PRICE</span>
                {newPrice === null ? (
                  <span style={{ ...t.subheading, color: c.text, margin: 0 }}>Price TBA</span>
                ) : size === 1 ? (
                  <span style={{ ...t.subheading, color: c.text, margin: 0 }}>
                    {formatPeso(newPrice)}
                  </span>
                ) : (
                  <>
                    <span style={{ ...t.subheading, color: c.text, margin: 0 }}>
                      {formatPeso(newPrice / size)} / person
                    </span>
                    <span style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
                      Bundle total {formatPeso(newPrice)} · {size} members
                    </span>
                  </>
                )}
              </div>
            </div>
          </Panel>

          {sizedMembers.map((person, i) => (
            <Panel key={i}>
              <div className="flex flex-col" style={{ gap: "1.25rem" }}>
                <span style={{ ...t.label, color: c.faint }}>
                  {i === 0 ? "PAYER" : `MEMBER ${i + 1}`}
                </span>
                <PersonFields
                  idPrefix={`m${i}`}
                  value={person}
                  errors={errorsFor(`members.${i}`, errors)}
                  onChange={(next) =>
                    setMembers((prev) => {
                      const copy = sizedMembers.slice();
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
          {errors.members && (
            <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
              {errors.members}
            </p>
          )}

          <Button type="submit" disabled={busy || !proofStorageKey} className="w-full sm:w-auto">
            {busy ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </Column>
    </Surface>
  );
}
