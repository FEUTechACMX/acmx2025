"use client";
import React, { useState, useEffect } from "react";
import type { safeUser } from "@/types/auth";
import LoginModal from "@/components/login/modal/LogInModal";
import ProfileMenu from "./ProfileMenu";

type NavBarProps = {
  user: safeUser | null;
};

export default function NavBar({ user }: NavBarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-[7vw] w-[86vw] z-50 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center pointer-events-none select-none">
          <img src="/assets/logo.png" className="h-[38px]" alt="" />
          <h1 className="font-[Arian-bold] text-[32px]">ACM</h1>
        </div>

        {/* Desktop Nav Links */}
        <ul className="hidden lg:flex font-[Arian-light] justify-around w-[40vw]">
          <li>
            <a href="about" className="hover:text-[#CF78EC]">
              About
            </a>
          </li>
          <li>
            <a href="merchandise" className="hover:text-[#CF78EC]">
              Merchandise
            </a>
          </li>
          <li>
            <a href="events" className="hover:text-[#CF78EC]">
              Events
            </a>
          </li>
          <li>
            <a href="committee" className="hover:text-[#CF78EC]">
              Committee
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-[#CF78EC]">
              Officers
            </a>
          </li>
        </ul>

        {/* Desktop Login / Profile */}
        <div className="hidden lg:block">
          {user ? (
            <ProfileMenu user={user} />
          ) : (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => setIsLoginOpen(true)}
            >
              LogIn
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
          <ul className="flex flex-col gap-4 font-[Arian-light]">
            <li>
              <a href="about">About</a>
            </li>
            <li>
              <a href="merchandise">Merchandise</a>
            </li>
            <li>
              <a href="events">Events</a>
            </li>
            <li>
              <a href="committee">Committee</a>
            </li>
            <li>
              <a href="#">Officer</a>
            </li>
            {user?.role === "ADMIN" && (
              <li>
                <a href="/scanner">Scanner</a>
              </li>
            )}
          </ul>

          <div className="mt-4">
            {user ? (
              <ProfileMenu user={user} />
            ) : (
              <button
                className="w-full bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsLoginOpen(true);
                }}
              >
                LogIn
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
          window.location.reload(); // simplest & reliable
        }}
      />
    </>
  );
}
