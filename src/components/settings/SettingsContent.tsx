"use client";

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import type { safeUser } from "@/types/auth";

type SettingsContentProps = {
  user: safeUser;
};

export default function SettingsContent({ user }: SettingsContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Entry animation
  useEffect(() => {
    if (containerRef.current && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll(".settings-card");

      // Initial state
      gsap.set(containerRef.current, { opacity: 0 });
      gsap.set(cards, { opacity: 0, y: 30 });

      // Glitch effect on header
      const header = containerRef.current.querySelector(".settings-header");
      if (header) {
        gsap.set(header, { opacity: 0 });
        
        const tl = gsap.timeline();
        tl.to(header, { opacity: 1, duration: 0.05 })
          .to(header, { opacity: 0, duration: 0.03 })
          .to(header, { opacity: 1, duration: 0.05 })
          .to(header, { opacity: 0, duration: 0.02 })
          .to(header, { opacity: 1, duration: 0.2 });
      }

      // Fade in container and stagger cards
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.3,
        delay: 0.1,
      });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.3,
        ease: "power2.out",
      });
    }
  }, []);

  // Get role badge styling
  const getRoleBadge = () => {
    if (!user?.role) return { bg: "bg-gray-500", text: "Unknown" };
    const roleStyles: Record<string, { bg: string; text: string }> = {
      ADMIN: { bg: "bg-gradient-to-r from-red-500 to-orange-500", text: "Administrator" },
      EXECUTIVES: { bg: "bg-gradient-to-r from-[#CF78EC] to-[#a855f7]", text: "Executive" },
      JUNIOR_OFFICER: { bg: "bg-gradient-to-r from-blue-500 to-cyan-500", text: "Junior Officer" },
      MEMBER: { bg: "bg-gradient-to-r from-gray-500 to-gray-600", text: "Member" },
    };
    return roleStyles[user.role] || roleStyles.MEMBER;
  };

  const roleBadge = getRoleBadge();

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Decorative elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#CF78EC]/10 to-[#a855f7]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#CF78EC]/10 to-[#a855f7]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="settings-header mb-10">
          <h1 className="text-4xl font-['Arian-bold'] text-gray-800 mb-2">
            Settings
          </h1>
          <p className="text-gray-500 font-['Arian-light'] text-lg">
            Manage your account and preferences
          </p>
        </div>

        {/* Cards Container */}
        <div ref={cardsRef} className="space-y-6">
          {/* Profile Card */}
          <div className="settings-card relative">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#CF78EC] via-[#a855f7] to-[#CF78EC] rounded-2xl blur opacity-20" />

            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Gradient bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#CF78EC] via-[#a855f7] to-[#CF78EC]" />

              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Large Avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] p-[3px]">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] flex items-center justify-center text-white text-4xl font-bold">
                        {user?.name[0].toUpperCase()}
                      </div>
                    </div>
                    {/* Status indicator */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-['Arian-bold'] text-gray-800 mb-1">
                      {user?.name}
                    </h2>
                    <p className="text-gray-500 font-['Arian-light'] mb-3">
                      {user?.email}
                    </p>

                    {/* Badge and Points Row */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <span className={`px-3 py-1.5 text-sm font-medium text-white rounded-full ${roleBadge.bg}`}>
                        {roleBadge.text}
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200">
                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span className="font-semibold text-amber-700">{user?.points ?? 0}</span>
                        <span className="text-amber-600 text-sm">points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="settings-card bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CF78EC]/20 to-[#a855f7]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#CF78EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-['Arian-bold'] text-gray-800">
                  Account Information
                </h3>
              </div>

              <div className="grid gap-4">
                <InfoRow label="Full Name" value={user?.name || "—"} />
                <InfoRow label="Email Address" value={user?.email || "—"} />
                <InfoRow label="Student ID" value={user?.studentId || "—"} />
                <InfoRow label="Role" value={roleBadge.text} />
              </div>
            </div>
          </div>

          {/* Activity Summary Card */}
          <div className="settings-card bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CF78EC]/20 to-[#a855f7]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#CF78EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-['Arian-bold'] text-gray-800">
                  Activity Summary
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  }
                  label="Total Points"
                  value={user?.points ?? 0}
                  color="from-amber-400 to-orange-500"
                />
                <StatCard
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="Events Attended"
                  value="—"
                  color="from-[#CF78EC] to-[#a855f7]"
                />
                <StatCard
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  label="Member Since"
                  value="2025"
                  color="from-cyan-400 to-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-['Arian-light'] sm:w-40 mb-1 sm:mb-0">
        {label}
      </span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5 group hover:shadow-md transition-shadow duration-200">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-['Arian-bold'] text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-500 font-['Arian-light']">{label}</p>
    </div>
  );
}
