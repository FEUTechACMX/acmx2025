"use client";
import React, { useState } from "react";
import type { safeUser } from "../../types/auth";

type ProfileMenuProps = {
  user: safeUser;
};

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogOut = async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.reload();
  };

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-bold focus:outline-none"
      >
        {user?.name[0].toUpperCase()}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
          {/* User name at top */}
          <div className="p-3 border-b">
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-gray-500">Points: 123</p>{" "}
            {/* placeholder */}
          </div>

          {/* Menu items */}
          <ul className="flex flex-col">
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                User Settings
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogOut}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
