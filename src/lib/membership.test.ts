import { describe, expect, it } from "vitest";
import {
  BUNDLE_SIZE,
  EXISTING_ACCOUNT_ERROR,
  mayFlipMembershipStatus,
  validateMembershipApplication,
  validatePerson,
  validateRenewalPayload,
} from "./membership";

const person = (over: Record<string, unknown> = {}) => ({
  studentId: "202312437",
  firstName: "Ada",
  middleName: "",
  lastName: "Lovelace",
  suffix: "",
  yearLevel: 2,
  degreeProgram: "BSCS",
  schoolEmail: "ada@fit.edu.ph",
  personalEmail: "ada@example.com",
  contactNumber: "09171234567",
  facebookLink: "https://facebook.com/ada",
  discordName: "",
  password: "Correct1horse",
  ...over,
});

describe("validatePerson", () => {
  it("accepts a complete applicant", () => {
    const result = validatePerson(person());
    expect(result.ok).toBe(true);
  });

  it("rejects a missing student number", () => {
    const result = validatePerson(person({ studentId: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.studentId).toMatch(/required/i);
  });

  it("rejects a weak password", () => {
    const result = validatePerson(person({ password: "short" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeTruthy();
  });
});

describe("validateMembershipApplication", () => {
  it("accepts a solo new application", () => {
    const result = validateMembershipApplication({
      bundle: "SOLO",
      proofStorageKey: "1-abc.jpg",
      members: [person()],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects the wrong member count for a bundle", () => {
    const result = validateMembershipApplication({
      bundle: "PARTNER",
      proofStorageKey: "1-abc.jpg",
      members: [person()],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.members).toMatch(/exactly 2/);
  });

  it("rejects duplicate student numbers inside a bundle (B3)", () => {
    const result = validateMembershipApplication({
      bundle: "PARTNER",
      proofStorageKey: "1-abc.jpg",
      members: [
        person(),
        person({
          studentId: "202312437",
          schoolEmail: "other@fit.edu.ph",
          personalEmail: "other@example.com",
        }),
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.members).toMatch(/unique/i);
  });

  it("rejects duplicate emails inside a bundle (B3)", () => {
    const result = validateMembershipApplication({
      bundle: "PARTNER",
      proofStorageKey: "1-abc.jpg",
      members: [
        person(),
        person({
          studentId: "202399999",
          schoolEmail: "ada@fit.edu.ph",
          personalEmail: "other@example.com",
        }),
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("normalises school email local-part to @fit.edu.ph", () => {
    const result = validatePerson(person({ schoolEmail: "ada" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.schoolEmail).toBe("ada@fit.edu.ph");
  });
});

describe("validateRenewalPayload", () => {
  it("accepts solo renewal with no teammates", () => {
    const result = validateRenewalPayload({
      bundle: "SOLO",
      proofStorageKey: "1-abc.jpg",
      teammates: [],
    });
    expect(result.ok).toBe(true);
  });

  it("requires one teammate for partner renewal", () => {
    const result = validateRenewalPayload({
      bundle: "PARTNER",
      proofStorageKey: "1-abc.jpg",
      teammates: [],
    });
    expect(result.ok).toBe(false);
  });
});

describe("mayFlipMembershipStatus (B1)", () => {
  it("allows flipping a PENDING user this application created", () => {
    expect(
      mayFlipMembershipStatus({ createdAsPending: true, membershipStatus: "PENDING" })
    ).toBe(true);
  });

  it("refuses to touch an already-APPROVED member", () => {
    expect(
      mayFlipMembershipStatus({ createdAsPending: false, membershipStatus: "APPROVED" })
    ).toBe(false);
    expect(
      mayFlipMembershipStatus({ createdAsPending: true, membershipStatus: "APPROVED" })
    ).toBe(false);
  });
});

describe("bundle sizes", () => {
  it("matches the locked kinds", () => {
    expect(BUNDLE_SIZE.SOLO).toBe(1);
    expect(BUNDLE_SIZE.PARTNER).toBe(2);
    expect(BUNDLE_SIZE.BUNDLE_5).toBe(5);
    expect(BUNDLE_SIZE.BUNDLE_8).toBe(8);
  });
});

describe("EXISTING_ACCOUNT_ERROR (B2)", () => {
  it("does not name the colliding field", () => {
    expect(EXISTING_ACCOUNT_ERROR.toLowerCase()).not.toMatch(/email/);
    expect(EXISTING_ACCOUNT_ERROR).toMatch(/log in to renew/i);
  });
});
