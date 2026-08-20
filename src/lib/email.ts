/**
 * Account claim / reset email via Nodemailer + Gmail App Password.
 * Node runtime only. SPEC-D5 §8.5.
 */
import nodemailer from "nodemailer";
import type { AccountTokenKind } from "@prisma/client";

function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (!raw) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not set.");
  }
  return raw;
}

function transporter() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set.");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export function claimLink(rawToken: string): string {
  return `${baseUrl()}/account/claim?token=${encodeURIComponent(rawToken)}`;
}

function claimCopy(link: string) {
  return {
    subject: "Set up your ACMX account",
    text: [
      "Welcome to FEU Tech ACM Student Chapter.",
      "",
      "Use this one-time link to set up your account password. It expires in 2 hours and can only be used once.",
      "",
      link,
      "",
      "If you did not expect this email, you can ignore it.",
      "",
      "— ACMX",
    ].join("\n"),
    html: `
      <p>Welcome to FEU Tech ACM Student Chapter.</p>
      <p>Use this one-time link to <strong>set up your account</strong> password. It expires in 2 hours and can only be used once.</p>
      <p><a href="${link}">Set up your account</a></p>
      <p style="color:#666;font-size:12px">If you did not expect this email, you can ignore it.</p>
      <p>— ACMX</p>
    `,
  };
}

function resetCopy(link: string) {
  return {
    subject: "Reset your ACMX password",
    text: [
      "You asked to reset your ACMX password.",
      "",
      "Use this one-time link to choose a new password. It expires in 2 hours and can only be used once.",
      "",
      link,
      "",
      "If you did not request this, you can ignore it — your password stays the same.",
      "",
      "— ACMX",
    ].join("\n"),
    html: `
      <p>You asked to <strong>reset your password</strong>.</p>
      <p>Use this one-time link to choose a new password. It expires in 2 hours and can only be used once.</p>
      <p><a href="${link}">Reset your password</a></p>
      <p style="color:#666;font-size:12px">If you did not request this, you can ignore it — your password stays the same.</p>
      <p>— ACMX</p>
    `,
  };
}

/**
 * Send CLAIM or RESET mail to the on-file school address only.
 * Never accepts a caller-supplied destination.
 */
export async function sendAccountTokenEmail(opts: {
  kind: AccountTokenKind;
  toSchoolEmail: string;
  rawToken: string;
}): Promise<void> {
  const link = claimLink(opts.rawToken);
  const copy = opts.kind === "CLAIM" ? claimCopy(link) : resetCopy(link);
  const from = process.env.GMAIL_USER!.trim();
  await transporter().sendMail({
    from: `ACMX <${from}>`,
    to: opts.toSchoolEmail,
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
  });
}
