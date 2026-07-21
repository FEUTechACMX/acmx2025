"use client";

import { useState, useEffect } from "react";
import RegistrationModal from "@/components/registration/RegistrationModal";
import { Button, Label, useDS } from "@/components/ds";

interface AttendButtonProps {
  eventId: string;
}

/** Inert twin of the accent button — same box, no affordance. */
function StaticState({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div
      className="select-none"
      style={{ border: `1px solid ${c.rule}`, padding: "0.8rem 2.25rem", textAlign: "center" }}
    >
      <Label style={{ color: c.faint }}>{children}</Label>
    </div>
  );
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

  if (checking) return <StaticState>Checking…</StaticState>;
  if (isRegistered) return <StaticState>Registered ✓</StaticState>;

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Register Now</Button>

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
