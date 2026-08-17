"use client";

import React, { useEffect, useRef, useState } from "react";
import type { safeUser } from "@/types/auth";
import { useDS, useConfirm } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, SectionLabel, AdminButton } from "./AdminShell";
import Icon from "./icons";

type Video = {
  id: string;
  title: string;
  subtitle: string | null;
  videoUrl: string;
  redirectUrl: string | null;
  order: number;
};

export default function VideosManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const { confirm, dialog } = useConfirm();
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((d) => setVideos(d.videos ?? []))
      .catch(() => {});
  };
  useEffect(load, []);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("bucket", "videos");
    fd.append("files", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd }).then((r) => r.json());
      if (res.urls?.[0]) setVideoUrl(res.urls[0]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const add = async () => {
    if (!title || !videoUrl) return;
    setBusy(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle, videoUrl, redirectUrl, order: videos.length }),
      });
      if (res.ok) {
        setTitle(""); setSubtitle(""); setVideoUrl(""); setRedirectUrl("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const confirmed = await confirm({
      title: "Remove this featured video?",
      body: "It comes off the dashboard carousel straight away.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!confirmed) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  const input: React.CSSProperties = {
    ...t.bodySmall, padding: "11px 13px", background: "transparent", color: c.text,
    border: `1px solid ${c.ruleStrong}`, outline: "none", width: "100%",
  };

  return (
    <AdminShell user={user} breadcrumb="Videos" searchPlaceholder="Search videos…">
      {dialog}
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${videos.length} FEATURED VIDEOS`}
          title="Videos"
          subtitle="Featured videos play in the dashboard hero slideshow. Upload a file or paste a URL, plus a link to send viewers to."
        />

        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)" }}>
          {/* List */}
          <div className="flex flex-col" style={{ gap: 16 }}>
            <SectionLabel>ON THE DASHBOARD</SectionLabel>
            {videos.length === 0 && <span style={{ ...t.bodySmall, color: c.muted }}>No videos yet. Add one on the right.</span>}
            {videos.map((v) => (
              <div key={v.id} className="flex items-center justify-between" style={{ gap: 16, padding: 16, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
                <div className="flex items-center min-w-0" style={{ gap: 14 }}>
                  <div className="flex items-center justify-center shrink-0" style={{ width: 46, height: 46, backgroundColor: c.accentWash, color: c.accent }}>
                    <Icon name="videos" size={20} />
                  </div>
                  <div className="flex flex-col min-w-0" style={{ gap: 3 }}>
                    <span style={{ ...t.body, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
                    <span style={{ ...t.mono, color: c.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.redirectUrl || v.videoUrl}</span>
                  </div>
                </div>
                <button onClick={() => remove(v.id)} title="Remove" className="flex items-center justify-center cursor-pointer shrink-0" style={{ width: 34, height: 34, color: c.muted, border: `1px solid ${c.rule}` }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add form */}
          <div className="flex flex-col" style={{ gap: 16, padding: 20, backgroundColor: c.panel, border: `1px solid ${c.rule}`, alignSelf: "start" }}>
            <span style={{ ...t.label, color: c.faint }}>ADD A VIDEO</span>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={input} />
            <input placeholder="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={input} />
            <input placeholder="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={input} />
            <input ref={fileRef} type="file" accept="video/*" hidden onChange={uploadFile} />
            <AdminButton variant="ghost" icon="upload" onClick={() => fileRef.current?.click()} disabled={busy} block>
              {busy ? "UPLOADING…" : "UPLOAD A FILE"}
            </AdminButton>
            <input placeholder="Redirect link (optional)" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} style={input} />
            <AdminButton icon="plus" onClick={add} disabled={busy || !title || !videoUrl} block>ADD VIDEO</AdminButton>
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  );
}
