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
        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md"
        onClick={() => setModalOpen(true)}
      >
        Attend
      </button>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        eventId={eventId} // Pass the eventId prop here
      />
    </>
  );
};

export default AttendButton;
