import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN,
  studentNumber,
  STUDENT_NUMBER_INVALID,
  validatePasswordStrength,
} from "./validation";
import {
  composeSchoolEmail,
  normalizeSchoolEmail,
  schoolEmail,
  schoolEmailLocalPart,
} from "./school-email";
import {
  calendarDateInManila,
  isDateInInclusiveRange,
  joWindow,
  membershipWindow,
} from "./campaign-windows";
import {
  hashAccountToken,
  isTokenRedeemable,
  mintRawAccountToken,
} from "./account-tokens";

describe("validatePasswordStrength (§8.4)", () => {
  const ctx = {
    studentId: "202312437",
    contactNumber: "09171234567",
    schoolEmail: "ada@fit.edu.ph",
    personalEmail: "ada.lovelace@gmail.com",
  };

  it(`requires at least ${PASSWORD_MIN} characters`, () => {
    expect(validatePasswordStrength("Ab1!", ctx)).toMatch(/at least/i);
  });

  it("requires ≥3 character classes", () => {
    expect(validatePasswordStrength("abcdefghij", ctx)).toMatch(/3 of/i);
    expect(validatePasswordStrength("abcdefghij1", ctx)).toMatch(/3 of/i);
    expect(validatePasswordStrength("Abcdefghij1", ctx)).toBeNull();
  });

  it(`rejects input longer than ${PASSWORD_MAX_BYTES} bytes`, () => {
    const long = "Aa1!" + "x".repeat(PASSWORD_MAX_BYTES);
    expect(validatePasswordStrength(long, ctx)).toMatch(/bytes/i);
  });

  it("rejects the student number", () => {
    expect(validatePasswordStrength("Xx202312437!", ctx)).toMatch(/student/i);
  });

  it("rejects the phone number", () => {
    expect(validatePasswordStrength("Xx09171234567!", ctx)).toMatch(/phone/i);
  });

  it("rejects the email local-part", () => {
    expect(validatePasswordStrength("Xxada_extra1!", ctx)).toMatch(/email/i);
  });

  it("rejects obvious values", () => {
    expect(validatePasswordStrength("password123!", ctx)).toMatch(/guess/i);
    expect(validatePasswordStrength("12345678901", ctx)).not.toBeNull();
  });

  it("accepts a strong password", () => {
    expect(validatePasswordStrength("Tr0ub4dor&3", ctx)).toBeNull();
  });
});

describe("studentNumber (§13 format)", () => {
  it("accepts 8–11 digit ids", () => {
    const rule = studentNumber();
    for (const id of ["20231243", "202312437", "20231243701"]) {
      expect(rule(id)).toBeNull();
    }
  });

  it("rejects non-digits and wrong lengths with the exact sentence", () => {
    const rule = studentNumber();
    for (const id of ["", "e", "2023", "202312437012", "2023abcd", " 202312437 "]) {
      // str() trims, so padded digits of valid length pass — spaces-only / letters fail
      if (id === " 202312437 ") {
        expect(rule(id)).toBeNull();
        continue;
      }
      expect(rule(id)).toBe(STUDENT_NUMBER_INVALID);
    }
  });
});

describe("school email lock (§8.8)", () => {
  it("composes @fit.edu.ph from a local part", () => {
    expect(composeSchoolEmail("ada")).toBe("ada@fit.edu.ph");
    expect(normalizeSchoolEmail("ADA@Other.edu")).toBe("ada@fit.edu.ph");
    expect(schoolEmailLocalPart("ada@fit.edu.ph")).toBe("ada");
  });

  it("schoolEmail() rule accepts only fit.edu.ph", () => {
    const rule = schoolEmail();
    expect(rule("ada")).toBeNull();
    expect(rule("ada@fit.edu.ph")).toBeNull();
    expect(rule("")).toMatch(/required/i);
  });
});

describe("campaign windows (§9)", () => {
  it("treats inclusive calendar ranges", () => {
    expect(isDateInInclusiveRange("2026-08-31", "2026-08-31", "2026-09-05")).toBe(true);
    expect(isDateInInclusiveRange("2026-09-05", "2026-08-31", "2026-09-05")).toBe(true);
    expect(isDateInInclusiveRange("2026-08-30", "2026-08-31", "2026-09-05")).toBe(false);
    expect(isDateInInclusiveRange("2026-09-06", "2026-08-31", "2026-09-05")).toBe(false);
  });

  it("returns unconfigured when env is missing", () => {
    const prev = {
      ms: process.env.MEMBERSHIP_WINDOW_START,
      me: process.env.MEMBERSHIP_WINDOW_END,
      js: process.env.JO_WINDOW_START,
      je: process.env.JO_WINDOW_END,
    };
    delete process.env.MEMBERSHIP_WINDOW_START;
    delete process.env.MEMBERSHIP_WINDOW_END;
    delete process.env.JO_WINDOW_START;
    delete process.env.JO_WINDOW_END;
    const mw = membershipWindow();
    expect(mw.open).toBe(false);
    if (!mw.open) expect(mw.phase).toBe("unconfigured");
    expect(joWindow().open).toBe(false);
    process.env.MEMBERSHIP_WINDOW_START = prev.ms;
    process.env.MEMBERSHIP_WINDOW_END = prev.me;
    process.env.JO_WINDOW_START = prev.js;
    process.env.JO_WINDOW_END = prev.je;
  });

  it("formats Manila calendar dates as YYYY-MM-DD", () => {
    expect(calendarDateInManila(new Date("2026-08-31T00:00:00+08:00"))).toBe("2026-08-31");
  });
});

describe("account tokens (§8.1)", () => {
  it("mints base64url raw tokens and hashes stably", () => {
    const raw = mintRawAccountToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(raw.length).toBeGreaterThanOrEqual(40);
    expect(hashAccountToken(raw)).toBe(hashAccountToken(raw));
    expect(hashAccountToken(raw)).not.toBe(raw);
    expect(hashAccountToken(raw)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("isTokenRedeemable checks usedAt and expiry", () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);
    expect(isTokenRedeemable({ expiresAt: future, usedAt: null })).toBe(true);
    expect(isTokenRedeemable({ expiresAt: future, usedAt: new Date() })).toBe(false);
    expect(isTokenRedeemable({ expiresAt: past, usedAt: null })).toBe(false);
  });
});
