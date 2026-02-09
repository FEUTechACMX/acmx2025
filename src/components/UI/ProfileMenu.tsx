"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { SafeUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

type ProfileMenuProps = {
  user: SafeUser;
};

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // GSAP Glitch animation on dropdown open
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const elements = dropdown.querySelectorAll(".glitch-target");
      
      // Initial state
      gsap.set(dropdown, { opacity: 0, y: -10, scale: 0.95 });
      gsap.set(elements, { opacity: 0 });

      // Main timeline
      const tl = gsap.timeline();

      // Glitch effect - rapid flicker
      tl.to(dropdown, { opacity: 1, duration: 0.05 })
        .to(dropdown, { opacity: 0, duration: 0.03 })
        .to(dropdown, { opacity: 1, duration: 0.05 })
        .to(dropdown, { opacity: 0, duration: 0.02 })
        .to(dropdown, { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.2, 
          ease: "power2.out" 
        })
        .to(elements, { 
          opacity: 1, 
          duration: 0.15, 
          stagger: 0.03 
        }, "-=0.1");
    }
  }, [isOpen]);

  const handleLogOut = async () => {
    await logoutAction();
  };

  // Get role badge styling
  const getRoleBadge = () => {
    if (!user?.role) return null;
    const roleStyles: Record<string, string> = {
      ADMIN: "bg-gradient-to-r from-red-500 to-orange-500",
      EXECUTIVES: "bg-gradient-to-r from-[#CF78EC] to-[#a855f7]",
      JUNIOR_OFFICER: "bg-gradient-to-r from-blue-500 to-cyan-500",
      MEMBER: "bg-gradient-to-r from-gray-500 to-gray-600",
    };
    return roleStyles[user.role] || roleStyles.MEMBER;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] p-[2px] focus:outline-none focus:ring-2 focus:ring-[#CF78EC]/50 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg hover:shadow-[#CF78EC]/30 cursor-pointer group"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] flex items-center justify-center text-white text-lg font-bold group-hover:from-[#b85cd6] group-hover:to-[#9333ea] transition-all duration-200">
          {user?.name[0].toUpperCase()}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-3 w-64 z-50 transform origin-top-right"
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#CF78EC] via-[#a855f7] to-[#CF78EC] rounded-2xl blur-lg opacity-20" />

          {/* Dropdown content */}
          <div className="relative bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top gradient bar */}
            <div className="h-1 bg-gradient-to-r from-[#CF78EC] via-[#a855f7] to-[#CF78EC]" />

            {/* User Info Section */}
            <div className="p-4 border-b border-gray-100 glitch-target">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] p-[2px] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] flex items-center justify-center text-white text-xl font-bold">
                    {user?.name[0].toUpperCase()}
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-['Arian-bold'] text-gray-800 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 font-['Arian-light'] truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Role Badge & Points */}
              <div className="flex items-center justify-between mt-3">
                <span className={`px-2.5 py-1 text-xs font-medium text-white rounded-full ${getRoleBadge()}`}>
                  {user?.role}
                </span>
                <div className="flex items-center gap-1.5 text-sm">
                  <svg className="w-4 h-4 text-[#CF78EC]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="font-medium text-gray-700">{user?.points ?? 0}</span>
                  <span className="text-gray-500 text-xs">pts</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                href="/settings"
                className="glitch-target flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-[#CF78EC]/10 hover:to-transparent hover:text-[#CF78EC] transition-all duration-200 group"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-[#CF78EC] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-['Arian-light'] text-sm">Settings</span>
              </Link>

              <button
                className="glitch-target w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent hover:text-red-500 transition-all duration-200 group cursor-pointer"
                onClick={handleLogOut}
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-['Arian-light'] text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
