"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import type { safeUser } from "@/types/auth";

type RegistrationItem = {
  id: string;
  eventName: string;
  eventDate: string;
  role: string;
  createdAt: string;
};

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  venue: string;
  startDate: string;
  endDate: string;
};

type TransactionItem = {
  id: string;
  type: string;
  description: string;
  status: string;
  points: number | null;
  createdAt: string;
};

type ProfileData = {
  recentRegistrations: RegistrationItem[];
  upcomingEvents: EventItem[];
  recentTransactions: TransactionItem[];
  stats: {
    eventsAttended: number;
    totalRegistrations: number;
  };
};

type ProfileContentProps = {
  user: safeUser;
};

export default function ProfileContent({ user }: ProfileContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.ok) setData(json);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const sections = containerRef.current.querySelectorAll(".profile-section");
    gsap.set(sections, { opacity: 0, y: 15 });
    gsap.to(sections, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.12,
      delay: 0.15,
      ease: "power2.out",
    });
  }, [loading]);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-amber-600 bg-amber-50 border-amber-200";
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "ATTENDANCE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "REWARDS":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        );
      case "PURCHASE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white pt-28 pb-20 px-6 sm:px-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="profile-section mb-14">
          <h1 className="text-4xl sm:text-5xl font-['Arian-bold'] text-gray-900 tracking-tight">
            Profile
          </h1>
          <div className="w-12 h-[2px] bg-[#CF78EC] mt-4 mb-3" />
          <p className="text-gray-500 font-['Arian-light'] text-lg">
            Your account overview
          </p>
        </div>

        {/* Profile Card + Quick Stats */}
        <div className="profile-section mb-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 border border-gray-100 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#CF78EC] flex items-center justify-center text-white text-2xl font-['Arian-bold'] shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-['Arian-bold'] text-gray-900 leading-tight truncate">
                  {user?.name}
                </h2>
                <p className="text-gray-400 font-['Arian-light'] text-sm mt-0.5 truncate">
                  {user?.email}
                </p>
                <span className="inline-block mt-2 text-xs font-['Arian-bold'] text-[#CF78EC] border border-[#CF78EC] px-2.5 py-0.5">
                  {getRoleLabel()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-6">
            <StatCard
              label="Points"
              value={user?.points ?? 0}
              loading={false}
            />
            <StatCard
              label="Events Attended"
              value={data?.stats.eventsAttended ?? "—"}
              loading={loading}
            />
            <StatCard
              label="Total Registrations"
              value={data?.stats.totalRegistrations ?? "—"}
              loading={loading}
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upcoming Events */}
          <div className="profile-section">
            <SectionHeader title="Upcoming Events" />
            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : data?.upcomingEvents.length ? (
              <div className="border-t border-gray-100">
                {data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="py-4 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors px-2 -mx-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-['Arian-bold'] text-gray-900 text-sm leading-tight">
                          {event.name}
                        </p>
                        <p className="text-gray-400 font-['Arian-light'] text-xs mt-1">
                          {event.venue}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 font-['Arian-light'] whitespace-nowrap mt-0.5">
                        {formatDate(event.startDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming events" />
            )}
          </div>

          {/* Recent Registrations */}
          <div className="profile-section">
            <SectionHeader title="Recent Registrations" />
            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : data?.recentRegistrations.length ? (
              <div className="border-t border-gray-100">
                {data.recentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="py-4 border-b border-gray-50 group hover:bg-gray-50/50 transition-colors px-2 -mx-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-['Arian-bold'] text-gray-900 text-sm leading-tight">
                          {reg.eventName}
                        </p>
                        <p className="text-gray-400 font-['Arian-light'] text-xs mt-1">
                          Registered as {reg.role === "MEMBER" ? "Member" : "Non-member"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 font-['Arian-light'] whitespace-nowrap mt-0.5">
                        {formatDate(reg.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No registrations yet" />
            )}
          </div>

          {/* Recent Transactions — full width */}
          <div className="profile-section lg:col-span-2">
            <SectionHeader title="Recent Transactions" />
            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : data?.recentTransactions.length ? (
              <div className="border-t border-gray-100">
                {data.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-2 -mx-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-['Arian-bold'] text-gray-900 text-sm truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-3 shrink-0">
                            {tx.points !== null && (
                              <span className="text-sm font-['Arian-bold'] text-[#CF78EC]">
                                {tx.points > 0 ? "+" : ""}{tx.points} pts
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 border font-['Arian-light'] ${getStatusStyle(tx.status)}`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 font-['Arian-light']">
                            {tx.type}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400 font-['Arian-light']">
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No transactions yet" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400 mb-4">
      {title}
    </h3>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <div className="border border-gray-100 p-5">
      {loading ? (
        <div className="h-8 w-16 bg-gray-100 animate-pulse mb-2" />
      ) : (
        <p className="text-3xl font-['Arian-bold'] text-gray-900 leading-none">
          {value}
        </p>
      )}
      <div className="w-6 h-[2px] bg-[#CF78EC] mt-2 mb-1.5" />
      <p className="text-sm text-gray-400 font-['Arian-light']">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-t border-gray-100 py-10 text-center">
      <p className="text-gray-300 font-['Arian-light'] text-sm">{message}</p>
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="border-t border-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-4 border-b border-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 animate-pulse w-3/4" />
              <div className="h-3 bg-gray-50 animate-pulse w-1/2" />
            </div>
            <div className="h-3 bg-gray-100 animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
