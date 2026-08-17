import { describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => ({ prisma: {} }));

const { validateCommitteeInput, COMMITTEE_LIMITS } = await import("./committee");

const ok = (body: Record<string, unknown>) =>
  expect(validateCommitteeInput(body)).toBeNull();
const fails = (body: Record<string, unknown>, match: RegExp) =>
  expect(validateCommitteeInput(body)).toMatch(match);

describe("validateCommitteeInput — absent fields", () => {
  it("passes an empty payload", () => ok({}));
  it("passes a name-only create, which is all the route requires", () => ok({ name: "Media" }));
  it("treats null as absent", () => ok({ mandate: null, contactEmail: null, applyUrl: null }));
});

describe("text limits", () => {
  it("caps the name", () => {
    ok({ name: "x".repeat(COMMITTEE_LIMITS.name) });
    fails({ name: "x".repeat(COMMITTEE_LIMITS.name + 1) }, /120 characters or fewer/);
  });

  it("caps the long-form fields", () => {
    fails({ mandate: "x".repeat(COMMITTEE_LIMITS.mandate + 1) }, /characters or fewer/);
    fails({ callBody: "x".repeat(COMMITTEE_LIMITS.callBody + 1) }, /characters or fewer/);
  });

  it("rejects non-string text", () => {
    fails({ name: ["Media"] }, /must be text/);
  });
});

describe("contactEmail", () => {
  it("accepts a plausible address", () => ok({ contactEmail: "media@fit.edu.ph" }));

  it("rejects one that could never receive mail", () => {
    // Stored verbatim and rendered as a mailto: on the public page, so a broken
    // value became a dead control for every visitor.
    fails({ contactEmail: "media at fit" }, /.+/);
  });

  it("accepts an empty string as 'not set'", () => ok({ contactEmail: "" }));
});

describe("applyUrl", () => {
  it("accepts https and http", () => {
    ok({ applyUrl: "https://forms.gle/abc" });
    ok({ applyUrl: "http://example.org/apply" });
  });

  it("rejects something that is not a URL at all", () => {
    fails({ applyUrl: "forms.gle/abc" }, /full link/);
  });

  it("rejects a javascript: scheme", () => {
    fails({ applyUrl: "javascript:alert(1)" }, /http or https/);
  });

  it("accepts an empty string as 'not set'", () => ok({ applyUrl: "" }));
});

describe("openSeats", () => {
  it("accepts zero and small counts", () => {
    ok({ openSeats: 0 });
    ok({ openSeats: "12" });
  });

  it("rejects negatives and implausible counts", () => {
    fails({ openSeats: -3 }, /cannot be negative/);
    fails({ openSeats: 9999 }, /typo/);
  });
});

describe("child collections", () => {
  it("rejects a non-list", () => {
    for (const key of ["responsibilities", "projects", "facts", "members"]) {
      fails({ [key]: "one" }, /must be a list/);
    }
  });

  it("caps each collection", () => {
    fails(
      { responsibilities: Array(COMMITTEE_LIMITS.children + 1).fill({ title: "x" }) },
      /at most/
    );
    fails({ members: Array(COMMITTEE_LIMITS.members + 1).fill({ name: "x" }) }, /at most/);
  });

  it("accepts empty lists and normal sizes", () => {
    ok({ responsibilities: [], projects: [{ title: "Rebrand" }], members: [{ name: "Ada" }] });
  });
});
