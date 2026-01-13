"use client";
import React from "react";
import { useState, useEffect } from "react";
import type { User } from "../../types/auth";
import LoginModal from "../login/modal/LogInModal";

export default function NavBar() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        const data: { user?: User } = await res.json();
        setUser(data.user);
      } catch {
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <nav className="fixed top-0 left-0 w-full flex justify-between z-50">
      {/* Logo */}
      <div className="flex items-center justify-start">
        <img src="/assets/logo.png" className="h-[38px]" alt="" />
        <h1
          className="
            font-[Arian-bold] text-[32px] text-left
        "
        >
          ACM
        </h1>
      </div>

      {/* NavBar Contents  */}
      <div>
        <ul>
          <li>
            <a href="#" className="hover:text-[#CF78EC]">
              About
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-[#CF78EC]">
              Merchandise
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-[#CF78EC]">
              Events
            </a>
          </li>
        </ul>
      </div>

      {/* Log-In + User Options */}
      <div>
        {user ? (
          <button>Profile ({user.name})</button>
        ) : (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={() => setIsLoginOpen(true)}
          >
            LogIn
          </button>
        )}
      </div>

      {/* Log In Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={async () => {
          const res = await fetch("/api/me");
          const data: { user?: User } = await res.json();
          setUser(data.user);
        }}
      />
    </nav>
  );
}
