// components/AttendButton.tsx
"use client";

import { useState } from "react";
import RegistrationModal from "@/components/registration/RegistrationModal";

interface AttendButtonProps {
  eventId: string;
}

const AttendButton: React.FC<AttendButtonProps> = ({ eventId }) => {
  const [isModalOpen, setModalOpen] = useState(false);

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
      />
    </>
  );
};

export default AttendButton;
