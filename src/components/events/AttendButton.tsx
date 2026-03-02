// components/AttendButton.tsx
"use client";

import { useState, useEffect } from "react";
import RegistrationModal from "@/components/registration/RegistrationModal";

interface AttendButtonProps {
  eventId: string;
}

const AttendButton: React.FC<AttendButtonProps> = ({ eventId }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkRegistration() {
      try {
        const res = await fetch(`/api/events/${eventId}/check-registration`);
        if (res.ok) {
          const data = await res.json();
          setIsRegistered(data.registered);
        }
      } catch {
        /* ignore */
      } finally {
        setChecking(false);
      }
    }
    checkRegistration();
  }, [eventId]);

  if (checking) {
    return (
      <div className="px-6 py-2.5 text-sm font-['Arian-bold'] text-gray-400 bg-gray-100">
        Loading...
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="px-6 py-2.5 text-sm font-['Arian-bold'] text-gray-400 bg-gray-100 select-none">
        Registered ✓
      </div>
    );
  }

  return (
    <>
      <button
        className="px-6 py-2.5 text-sm font-['Arian-bold'] text-white bg-[#CF78EC] hover:bg-[#b560d4] transition-colors cursor-pointer"
        onClick={() => setModalOpen(true)}
      >
        Register Now
      </button>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        eventId={eventId}
        onRegistrationSuccess={() => setIsRegistered(true)}
      />
    </>
  );
};

export default AttendButton;
