"use client";

import React, { useRef, useState } from "react";
import { Button, Label, useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";

export default function ProofUpload({
  storageKey,
  onUploaded,
  error,
}: {
  storageKey: string;
  onUploaded: (key: string) => void;
  error?: string | null;
}) {
  const { c } = useDS();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function onFile(file: File) {
    setLocalError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/membership/proof", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.storageKey) {
        setLocalError(json.error ?? "Could not upload that image.");
        return;
      }
      onUploaded(json.storageKey);
      setPreview(URL.createObjectURL(file));
    } catch {
      setLocalError("Could not upload that image.");
    } finally {
      setBusy(false);
    }
  }

  const message = error || localError;

  return (
    <div className="flex flex-col" style={{ gap: "0.75rem" }}>
      <Label>Proof of payment</Label>
      <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
        Upload a JPEG, PNG, or WebP of the GCash or bank transfer. Officers review this in the
        console — it is not public.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : storageKey ? "Replace image" : "Choose image"}
      </Button>
      {preview && (
        // Preview is a local object URL, not a design-token color.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Proof of payment preview"
          style={{ maxWidth: 280, border: `1px solid ${c.rule}` }}
        />
      )}
      {storageKey && !preview && (
        <span style={{ ...t.bodySmall, color: c.positive }}>Image attached.</span>
      )}
      {message && (
        <span role="alert" style={{ ...t.bodySmall, color: c.danger }}>
          {message}
        </span>
      )}
    </div>
  );
}
