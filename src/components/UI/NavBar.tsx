"use client";
<<<<<<< HEAD:components/UI/NavBar.tsx
import React, { useState } from "react";
import Link from "next/link";
import type { safeUser } from "../../types/auth";
import LoginModal from "../login/modal/LogInModal";
=======
import React, { useState, useEffect } from "react";
import type { safeUser } from "@/types/auth";
import LoginModal from "@/components/login/modal/LogInModal";
>>>>>>> cc7bd1b3b9fe62ea502f3768768e3b96c1bcca66:src/components/UI/NavBar.tsx
import ProfileMenu from "./ProfileMenu";

type NavBarProps = {
  user: safeUser | null;
};

export default function NavBar({ user }: NavBarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAcmDropdownOpen, setIsAcmDropdownOpen] = useState(false);
  const [isMobileAcmOpen, setIsMobileAcmOpen] = useState(false);

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
          <Link href="/" className="hover:text-[#CF78EC] transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-[#CF78EC] transition-colors">
            About
          </Link>
          <Link href="/merchandise" className="hover:text-[#CF78EC] transition-colors">
            Merchandise
          </Link>
          <Link href="/events" className="hover:text-[#CF78EC] transition-colors">
            Events
          </Link>
          
          {/* ACM Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsAcmDropdownOpen(true)}
            onMouseLeave={() => setIsAcmDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-[#CF78EC] transition-colors cursor-pointer">
              ACM
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isAcmDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isAcmDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white shadow-lg rounded-md py-2 border border-gray-100">
                <Link 
                  href="/committee" 
                  className="block px-4 py-2 text-gray-700 hover:bg-[#CF78EC]/10 hover:text-[#CF78EC] transition-colors"
                >
                  Committee
                </Link>
                <Link 
                  href="/officers" 
                  className="block px-4 py-2 text-gray-700 hover:bg-[#CF78EC]/10 hover:text-[#CF78EC] transition-colors"
                >
                  Officers
                </Link>
              </div>
            )}
          </div>

          {user?.role === "ADMIN" && (
            <Link href="/scanner" className="hover:text-[#CF78EC] transition-colors">
              Scanner
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
            <Link href="/" className="hover:text-[#CF78EC] transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#CF78EC] transition-colors">
              About
            </Link>
            <Link href="/merchandise" className="hover:text-[#CF78EC] transition-colors">
              Merchandise
            </Link>
            <Link href="/events" className="hover:text-[#CF78EC] transition-colors">
              Events
            </Link>
            
            {/* Mobile ACM Dropdown */}
            <div>
              <button 
                className="flex items-center gap-1 hover:text-[#CF78EC] transition-colors w-full cursor-pointer"
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
                    className="text-gray-600 hover:text-[#CF78EC] transition-colors"
                  >
                    Committee
                  </Link>
                  <Link 
                    href="/officers" 
                    className="text-gray-600 hover:text-[#CF78EC] transition-colors"
                  >
                    Officers
                  </Link>
                </div>
              )}
            </div>

            {user?.role === "ADMIN" && (
              <Link href="/scanner" className="hover:text-[#CF78EC] transition-colors">
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
