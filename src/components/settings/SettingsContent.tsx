"use client";

import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import type { safeUser } from "@/types/auth";

type SettingsContentProps = {
  user: safeUser;
};

export default function SettingsContent({ user }: SettingsContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sections = containerRef.current.querySelectorAll(".settings-section");

    gsap.set(sections, { opacity: 0, y: 15 });

    gsap.to(sections, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.12,
      delay: 0.15,
      ease: "power2.out",
    });
  }, []);

  const getRoleLabel = () => {
    if (!user?.role) return "Unknown";
    const labels: Record<string, string> = {
      ADMIN: "Administrator",
      EXECUTIVES: "Executive",
      JUNIOR_OFFICER: "Junior Officer",
      MEMBER: "Member",
    };
    return labels[user.role] || "Member";
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (newPassword !== confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPwMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMessage({ type: "success", text: data.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwMessage({ type: "error", text: data.message });
      }
    } catch {
      setPwMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-28 pb-20 px-6 sm:px-8"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="settings-section mb-14">
          <h1 className="text-4xl sm:text-5xl font-['Arian-bold'] text-gray-900 tracking-tight">
            Settings
          </h1>
          <div className="w-12 h-[2px] bg-[#CF78EC] mt-4 mb-3" />
          <p className="text-gray-500 font-['Arian-light'] text-lg">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile */}
        <div className="settings-section mb-14">
          <div className="flex items-start gap-5">
            {/* Avatar — square, no rounding */}
            <div className="w-16 h-16 bg-[#CF78EC] flex items-center justify-center text-white text-2xl font-['Arian-bold'] shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div>
              <h2 className="text-2xl font-['Arian-bold'] text-gray-900 leading-tight">
                {user?.name}
              </h2>
              <p className="text-gray-500 font-['Arian-light'] mt-0.5">
                {user?.email}
              </p>
              <span className="inline-block mt-2 text-sm font-['Arian-bold'] text-[#CF78EC] border border-[#CF78EC] px-3 py-1">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="settings-section mb-14">
          <h3 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400 mb-4">
            Account Information
          </h3>
          <div className="border-t border-gray-200">
            <InfoRow label="Full Name" value={user?.name || "—"} />
            <InfoRow label="Email Address" value={user?.email || "—"} />
            <InfoRow label="Student ID" value={user?.studentId || "—"} />
            <InfoRow label="Role" value={getRoleLabel()} />
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-section mb-14">
          <h3 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400 mb-4">
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="border-t border-gray-200 pt-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 font-['Arian-light'] mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-900 font-['Arian-light'] focus:outline-none focus:border-[#CF78EC] transition-colors"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 font-['Arian-light'] mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-900 font-['Arian-light'] focus:outline-none focus:border-[#CF78EC] transition-colors"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 font-['Arian-light'] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-200 text-gray-900 font-['Arian-light'] focus:outline-none focus:border-[#CF78EC] transition-colors"
                placeholder="Confirm new password"
              />
            </div>

            {pwMessage && (
              <p className={`text-sm font-['Arian-light'] ${pwMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                {pwMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="px-6 py-2.5 text-sm font-['Arian-bold'] text-white bg-[#CF78EC] hover:bg-[#b85cd6] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Activity */}
        <div className="settings-section">
          <h3 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400 mb-6">
            Activity
          </h3>
          <div className="grid grid-cols-3 gap-8">
            <StatItem label="Points" value={user?.points ?? 0} />
            <StatItem label="Events Attended" value="—" />
            <StatItem label="Member Since" value="2025" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3.5 border-b border-gray-100">
      <span className="text-sm text-gray-400 font-['Arian-light'] sm:w-40 mb-0.5 sm:mb-0">
        {label}
      </span>
      <span className="text-gray-900 font-['Arian-light']">{value}</span>
    </div>
  );
}

function StatItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-3xl font-['Arian-bold'] text-gray-900 leading-none">
        {value}
      </p>
      <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1.5" />
      <p className="text-sm text-gray-400 font-['Arian-light']">{label}</p>
    </div>
  );
}
