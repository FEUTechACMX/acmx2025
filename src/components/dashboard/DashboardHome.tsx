"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { safeUser } from "@/types/auth";

type EventPreview = {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  registrations: number;
};

type TransactionPreview = {
  id: string;
  type: string;
  description: string;
  status: string;
  points: number | null;
  createdAt: string;
};

type DashboardData = {
  upcomingEvents: EventPreview[];
  recentTransactions: TransactionPreview[];
  stats: {
    eventsAttended: number;
    totalRegistrations: number;
  };
};

type DashboardHomeProps = {
  user: safeUser;
};

export default function DashboardHome({ user }: DashboardHomeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.ok) {
        setData({
          upcomingEvents: json.upcomingEvents,
          recentTransactions: json.recentTransactions,
          stats: json.stats,
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const sections = containerRef.current.querySelectorAll(".home-section");
    gsap.set(sections, { opacity: 0, y: 20 });
    gsap.to(sections, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.1,
      ease: "power2.out",
    });
  }, [loading]);



  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white pt-28 pb-20 px-6 sm:px-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="home-section mb-12">
          <h1 className="text-4xl sm:text-5xl font-['Arian-bold'] text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <div className="w-12 h-[2px] bg-[#CF78EC] mt-4 mb-3" />
          <p className="text-gray-500 font-['Arian-light'] text-lg">
            Welcome back, {user?.name?.split(" ")[0]}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Upcoming Events — wider */}
          <div className="home-section lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400"
              >
                Upcoming Events
              </h2>
              <Link
                href="/events"
                className="text-xs text-[#CF78EC] font-['supermolot'] tracking-wide hover:underline"
              >
                View All →
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : data?.upcomingEvents.length ? (
              <div className="border-t border-gray-100">
                {data.upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-3 -mx-3 group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-['Arian-bold'] text-gray-900 text-sm leading-tight group-hover:text-[#CF78EC] transition-colors">
                          {event.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-400 font-['Arian-light']">
                            {event.venue}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400 font-['Arian-light']">
                            {event.registrations} registered
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-['Arian-bold'] text-gray-900">
                          {formatDate(event.startDate)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState message="No upcoming events at the moment" />
            )}
          </div>

          {/* Recent Activity — narrower */}
          <div className="home-section lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400">
                Recent Activity
              </h2>
              <Link
                href="/profile"
                className="text-xs text-[#CF78EC] font-['supermolot'] tracking-wide hover:underline"
              >
                See All →
              </Link>
            </div>

            {loading ? (
              <LoadingSkeleton rows={3} />
            ) : data?.recentTransactions.length ? (
              <div className="border-t border-gray-100">
                {data.recentTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3.5 border-b border-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-['Arian-bold'] text-gray-900 text-sm truncate">
                        {tx.description}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 border font-['Arian-light'] shrink-0 ${getStatusStyle(tx.status)}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-['Arian-light']">
                        {tx.type}
                      </span>
                      {tx.points !== null && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="text-xs font-['Arian-bold'] text-[#CF78EC]">
                            {tx.points > 0 ? "+" : ""}{tx.points} pts
                          </span>
                        </>
                      )}
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400 font-['Arian-light']">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No activity yet" />
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="home-section mt-14">
          <h2 className="text-xs font-['Arian-bold'] uppercase tracking-widest text-gray-400 mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickLink
              href="/events"
              label="Events"
              description="Browse all events"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <QuickLink
              href="/profile"
              label="Profile"
              description="Your account"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <QuickLink
              href="/about"
              label="About ACM"
              description="Learn more"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <QuickLink
              href="/settings"
              label="Settings"
              description="Manage account"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function QuickLink({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border border-gray-100 p-5 group hover:border-[#CF78EC]/30 transition-all duration-200"
    >
      <div className="text-gray-400 group-hover:text-[#CF78EC] transition-colors mb-3">
        {icon}
      </div>
      <p className="font-['Arian-bold'] text-gray-900 text-sm group-hover:text-[#CF78EC] transition-colors">
        {label}
      </p>
      <p className="text-xs text-gray-400 font-['Arian-light'] mt-0.5">
        {description}
      </p>
    </Link>
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
