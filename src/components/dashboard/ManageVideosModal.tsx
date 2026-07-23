"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { type as t } from "@/styles/design-system";
import { useDS, Button, Field, Eyebrow } from "@/components/ds";
import type { FeaturedVideo } from "./VideoCarousel";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Called after any create/delete so the dashboard can refetch. */
  onChanged?: () => void;
};

/**
 * Admin-only manager for the dashboard video slideshow. Upload a video file
 * (stored in the `videos` bucket) or paste a direct URL, attach a redirect
 * link + title, and manage the queue.
 */
export default function ManageVideosModal({ isOpen, onClose, onChanged }: Props) {
  const { c } = useDS();
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();
      if (json.ok) setVideos(json.videos);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const reset = () => {
    setTitle("");
    setSubtitle("");
    setRedirectUrl("");
    setVideoUrl("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setError(null);
    if (!title.trim()) return setError("A title is required.");
    if (!file && !videoUrl.trim()) return setError("Upload a video file or paste a video URL.");

    setBusy(true);
    try {
      let finalUrl = videoUrl.trim();

      if (file) {
        const fd = new FormData();
        fd.append("bucket", "videos");
        fd.append("files", file);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await upRes.json();
        if (!upRes.ok) throw new Error(upJson.error || "Upload failed");
        finalUrl = upJson.urls[0];
      }

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          videoUrl: finalUrl,
          redirectUrl: redirectUrl.trim() || undefined,
          order: videos.length,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save video");

      reset();
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        await load();
        onChanged?.();
      }
    } catch {
      /* ignore */
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "88vh",
          overflowY: "auto",
          backgroundColor: c.surface,
          border: `1px solid ${c.ruleStrong}`,
          padding: "clamp(1.5rem, 3vw, 2.5rem)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <span style={{ ...t.eyebrow, color: c.accent, display: "block", marginBottom: "0.4rem" }}>
              Admin
            </span>
            <h2 style={{ ...t.title, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: c.text, margin: 0 }}>
              Manage Videos
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: `1px solid ${c.rule}`,
              color: c.muted,
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Add form */}
        <div style={{ marginBottom: "1rem" }}>
          <Eyebrow words="Add a video" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <Field id="v-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Freshman Orientation Recap" />
          <Field id="v-subtitle" label="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Freshman Series · 01" />
          <Field id="v-redirect" label="Redirect link (optional)" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://youtube.com/..." />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>Video file</span>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ ...t.bodySmall, color: c.muted }}
            />
          </div>

          <Field
            id="v-url"
            label="…or paste a video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://.../clip.mp4"
            disabled={!!file}
          />

          {error && (
            <span style={{ ...t.bodySmall, color: "#d14343" }}>{error}</span>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Add video"}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Clear
            </Button>
          </div>
        </div>

        {/* Existing list */}
        <div style={{ margin: "1.75rem 0 1rem" }}>
          <Eyebrow words={["In the queue", loading ? "…" : `${videos.length}`]} />
        </div>
        {videos.length === 0 && !loading ? (
          <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>No videos yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {videos.map((v, i) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 0",
                  borderBottom: `1px solid ${c.rule}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...t.body, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {String(i + 1).padStart(2, "0")} · {v.title}
                  </div>
                  {v.redirectUrl && (
                    <div style={{ ...t.mono, color: c.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.redirectUrl}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(v.id)}
                  style={{
                    ...t.label,
                    textTransform: "uppercase",
                    color: c.muted,
                    background: "none",
                    border: `1px solid ${c.rule}`,
                    padding: "0.4rem 0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
