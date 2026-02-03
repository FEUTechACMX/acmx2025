"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { safeUser } from "@/types/auth";
import LoginModal from "@/components/login/modal/LogInModal";
import ProfileMenu from "./ProfileMenu";

type NavBarProps = {
  user: safeUser | null;
};

export default function NavBar({ user }: NavBarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAcmDropdownOpen, setIsAcmDropdownOpen] = useState(false);
  const [isMobileAcmOpen, setIsMobileAcmOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/hero";
    }
    return pathname.startsWith(href);
  };

  // Check if ACM section is active (committee or officers)
  const isAcmActive = pathname.startsWith("/committee") || pathname.startsWith("/officers");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAcmDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Active link styles
  const getLinkClasses = (href: string) => {
    const baseClasses = "transition-colors relative";
    if (isActive(href)) {
      return `${baseClasses} text-[#CF78EC] font-medium`;
    }
    return `${baseClasses} hover:text-[#CF78EC]`;
  };

  return (
    <>
      <nav className="fixed top-0 left-[7vw] w-[86vw] z-50 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center pointer-events-none select-none">
          <img src="/assets/logo.png" className="h-[38px]" alt="" />
          <h1 className="font-[Arian-bold] text-[32px]">ACM</h1>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex font-[Arian-light] items-center gap-8">
          <Link href="/" className={getLinkClasses("/")}>
            Home
            {isActive("/") && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
            )}
          </Link>
          <Link href="/about" className={getLinkClasses("/about")}>
            About
            {isActive("/about") && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
            )}
          </Link>
          <Link href="/merchandise" className={getLinkClasses("/merchandise")}>
            Merchandise
            {isActive("/merchandise") && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
            )}
          </Link>
          <Link href="/events" className={getLinkClasses("/events")}>
            Events
            {isActive("/events") && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
            )}
          </Link>
          
          {/* ACM Dropdown - Click to toggle */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`flex items-center gap-1 transition-colors cursor-pointer relative ${isAcmActive ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'}`}
              onClick={() => setIsAcmDropdownOpen(!isAcmDropdownOpen)}
            >
              ACM
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isAcmDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isAcmActive && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
              )}
            </button>
            
            {/* Dropdown Menu */}
            {isAcmDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white shadow-lg rounded-md py-2 border border-gray-100">
                <Link 
                  href="/committee" 
                  className={`block px-4 py-2 transition-colors ${isActive("/committee") ? 'text-[#CF78EC] bg-[#CF78EC]/10 font-medium' : 'text-gray-700 hover:bg-[#CF78EC]/10 hover:text-[#CF78EC]'}`}
                  onClick={() => setIsAcmDropdownOpen(false)}
                >
                  Committee
                </Link>
                <Link 
                  href="/officers" 
                  className={`block px-4 py-2 transition-colors ${isActive("/officers") ? 'text-[#CF78EC] bg-[#CF78EC]/10 font-medium' : 'text-gray-700 hover:bg-[#CF78EC]/10 hover:text-[#CF78EC]'}`}
                  onClick={() => setIsAcmDropdownOpen(false)}
                >
                  Officers
                </Link>
              </div>
            )}
          </div>

          {user?.role === "ADMIN" && (
            <Link href="/scanner" className={getLinkClasses("/scanner")}>
              Scanner
              {isActive("/scanner") && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#CF78EC] rounded-full" />
              )}
            </Link>
          )}
        </div>

        {/* Desktop Login / Profile */}
        <div className="hidden lg:block">
          {user ? (
            <ProfileMenu user={user} />
          ) : (
            <button
              className="px-5 py-2 text-[#CF78EC] font-['Supermolot'] text-sm tracking-wide border border-[#CF78EC] hover:bg-[#CF78EC] hover:text-white transition-all duration-200 cursor-pointer"
              onClick={() => setIsLoginOpen(true)}
            >
              Log In
            </button>
          )}
        </div>

        {/* Hamburger Button (mobile only) */}
        <button
          className="lg:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1">
            <span className="block w-6 h-0.5 bg-black" />
            <span className="block w-6 h-0.5 bg-black" />
            <span className="block w-6 h-0.5 bg-black" />
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed top-[70px] left-[7vw] w-[86vw] bg-white shadow-lg z-40 lg:hidden rounded-md p-4">
          <div className="flex flex-col gap-4 font-[Arian-light]">
            <Link 
              href="/" 
              className={`${isActive("/") ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'} transition-colors`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`${isActive("/about") ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'} transition-colors`}
            >
              About
            </Link>
            <Link 
              href="/merchandise" 
              className={`${isActive("/merchandise") ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'} transition-colors`}
            >
              Merchandise
            </Link>
            <Link 
              href="/events" 
              className={`${isActive("/events") ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'} transition-colors`}
            >
              Events
            </Link>
            
            {/* Mobile ACM Dropdown */}
            <div>
              <button 
                className={`flex items-center gap-1 transition-colors w-full cursor-pointer ${isAcmActive ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'}`}
                onClick={() => setIsMobileAcmOpen(!isMobileAcmOpen)}
              >
                ACM
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isMobileAcmOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileAcmOpen && (
                <div className="ml-4 mt-2 flex flex-col gap-2">
                  <Link 
                    href="/committee" 
                    className={`${isActive("/committee") ? 'text-[#CF78EC] font-medium' : 'text-gray-600 hover:text-[#CF78EC]'} transition-colors`}
                  >
                    Committee
                  </Link>
                  <Link 
                    href="/officers" 
                    className={`${isActive("/officers") ? 'text-[#CF78EC] font-medium' : 'text-gray-600 hover:text-[#CF78EC]'} transition-colors`}
                  >
                    Officers
                  </Link>
                </div>
              )}
            </div>

            {user?.role === "ADMIN" && (
              <Link 
                href="/scanner" 
                className={`${isActive("/scanner") ? 'text-[#CF78EC] font-medium' : 'hover:text-[#CF78EC]'} transition-colors`}
              >
                Scanner
              </Link>
            )}
          </div>

          <div className="mt-4">
            {user ? (
              <ProfileMenu user={user} />
            ) : (
              <button
                className="w-full py-2.5 text-[#CF78EC] font-['Supermolot'] text-sm tracking-wide border border-[#CF78EC] hover:bg-[#CF78EC] hover:text-white transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsLoginOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}
