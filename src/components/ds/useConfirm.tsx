"use client";

import { useCallback, useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Body } from "./Text";
import { useDS } from "./useDS";
import { type as t, motion } from "@/styles/design-system";

/**
 * A confirmation dialog that reads as part of the system.
 *
 * Five destructive actions used the browser's `confirm()` — an unstyled OS
 * dialog dropped into the middle of a deliberately art-directed console, which
 * can't be themed, can't be made accessible, and looks different on every
 * operating system (CLEANUP.md §6.6).
 *
 * It keeps `confirm()`'s one genuinely good property: it reads as a single
 * `await` at the call site, so the guard stays where the decision is instead of
 * being scattered across a state flag, a pending-action ref and a callback.
 *
 *   const { confirm, dialog } = useConfirm();
 *
 *   async function remove() {
 *     if (!(await confirm({ title: "Delete this?", danger: true }))) return;
 *     …
 *   }
 *
 *   return <>{dialog}…</>;
 *
 * The `dialog` element must be rendered somewhere in the tree. `ds/Modal`
 * portals it to the body, so where does not matter.
 */

export type ConfirmOptions = {
  title: string;
  /** The consequence, in a sentence. Skip it when the title already says it. */
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the consequence in the danger skin and the action in danger colours. */
  danger?: boolean;
};

type Pending = ConfirmOptions & { settle: (answer: boolean) => void };

export function useConfirm() {
  const { c } = useDS();
  const [pending, setPending] = useState<Pending | null>(null);

  // Held in a ref as well, so `settle` can never call a stale resolver if two
  // confirmations somehow overlap.
  const activeRef = useRef<Pending | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    // Any confirmation already on screen is answered "no" before this one opens,
    // so a promise is never left hanging.
    activeRef.current?.settle(false);

    return new Promise<boolean>((resolve) => {
      const next: Pending = { ...options, settle: resolve };
      activeRef.current = next;
      setPending(next);
    });
  }, []);

  const settle = useCallback((answer: boolean) => {
    activeRef.current?.settle(answer);
    activeRef.current = null;
    setPending(null);
  }, []);

  const dialog = pending ? (
    <Modal
      open
      onClose={() => settle(false)}
      title={pending.title}
      message={
        pending.body && pending.danger
          ? { tone: "danger", text: pending.body }
          : undefined
      }
      width={460}
      labelledBy="acmx-confirm-title"
      footer={
        <>
          <Button variant="ghost" onClick={() => settle(false)}>
            {pending.cancelLabel ?? "Cancel"}
          </Button>
          {pending.danger ? (
            // No danger variant on ds/Button, and one destructive dialog is not
            // enough to justify adding one to the primitive.
            <button
              type="button"
              onClick={() => settle(true)}
              style={{
                ...t.label,
                textTransform: "uppercase",
                padding: "0.7rem 1.4rem",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: c.danger,
                border: `1px solid ${c.danger}`,
                transition: `background-color ${motion.fast}, color ${motion.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.danger;
                e.currentTarget.style.color = c.surface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = c.danger;
              }}
            >
              {pending.confirmLabel ?? "Delete"}
            </button>
          ) : (
            <Button onClick={() => settle(true)}>
              {pending.confirmLabel ?? "Confirm"}
            </Button>
          )}
        </>
      }
    >
      {pending.body && !pending.danger ? <Body small>{pending.body}</Body> : null}
    </Modal>
  ) : null;

  return { confirm, dialog };
}
