import { describe, expect, it } from "vitest";
import { check, dateTime, hasErrors, money, notBefore, oneOf, required } from "./validation";

/**
 * The rules added when §6.4 was finally adopted on the event routes. Each exists
 * because the value it guards used to reach Prisma and come back as a 500.
 */

describe("oneOf", () => {
  const rule = oneOf("Semester", ["FIRST", "SECOND", "THIRD"]);

  it("accepts a member of the set", () => {
    expect(rule("SECOND")).toBeNull();
  });

  it("trims before comparing", () => {
    expect(rule("  THIRD  ")).toBeNull();
  });

  it("is case-sensitive, because Prisma enums are", () => {
    expect(rule("first")).not.toBeNull();
  });

  it("rejects non-members and names the options", () => {
    expect(rule("FOURTH")).toContain("FIRST, SECOND, THIRD");
  });

  it("rejects null, undefined and objects rather than throwing", () => {
    for (const v of [null, undefined, {}, [], 3]) expect(rule(v)).not.toBeNull();
  });
});

describe("dateTime", () => {
  const rule = dateTime("Start date");

  it("accepts an ISO timestamp", () => {
    expect(rule("2026-08-17T12:00:00Z")).toBeNull();
  });

  it("accepts the datetime-local shape the form actually sends", () => {
    expect(rule("2026-08-17T09:00")).toBeNull();
  });

  it("rejects prose that Date cannot parse", () => {
    // `new Date("tomorrow")` is an Invalid Date, and Prisma throws on those.
    expect(rule("tomorrow")).toContain("not a valid date");
  });

  it("rejects an empty value as missing rather than invalid", () => {
    expect(rule("")).toContain("required");
  });

  it("rejects a wholly out-of-range date", () => {
    expect(rule("2026-13-45")).not.toBeNull();
  });
});

describe("money", () => {
  const rule = money("Member rate");

  it("accepts zero and positive amounts, as number or string", () => {
    for (const v of [0, 60, "0", "199.5"]) expect(rule(v)).toBeNull();
  });

  it("rejects negatives", () => {
    expect(rule(-1)).toContain("cannot be negative");
  });

  it("rejects values that coerce to NaN", () => {
    // `Number("free")` is NaN, which used to reach the database.
    expect(rule("free")).toContain("must be a number");
  });

  it("rejects Infinity", () => {
    expect(rule(Infinity)).not.toBeNull();
  });
});

describe("notBefore", () => {
  it("passes when the end is after the start", () => {
    expect(
      notBefore({ a: "2026-08-01", b: "2026-08-05" }, "a", "b", "bad")
    ).toBeNull();
  });

  it("passes when they are equal — a single-instant event is legitimate", () => {
    expect(notBefore({ a: "2026-08-01", b: "2026-08-01" }, "a", "b", "bad")).toBeNull();
  });

  it("fails when the end falls before the start", () => {
    expect(notBefore({ a: "2026-08-05", b: "2026-08-01" }, "a", "b", "bad")).toBe("bad");
  });

  it("stays quiet on unparseable input, leaving that to dateTime", () => {
    expect(notBefore({ a: "nonsense", b: "2026-08-01" }, "a", "b", "bad")).toBeNull();
  });
});

describe("check, over a whole event payload", () => {
  const rules = {
    name: [required("Event name")],
    eventSemester: [oneOf("Semester", ["FIRST", "SECOND", "THIRD"])],
    startDate: [dateTime("Start date")],
    price: [money("Officer rate")],
  };

  it("passes a well-formed payload", () => {
    const errors = check(
      { name: "ACM Week", eventSemester: "THIRD", startDate: "2026-08-17T09:00", price: 0 },
      rules
    );
    expect(hasErrors(errors)).toBe(false);
  });

  it("collects one failure per field, not just the first overall", () => {
    const errors = check(
      { name: "", eventSemester: "FOURTH", startDate: "tomorrow", price: "free" },
      rules
    );
    expect(Object.keys(errors).sort()).toEqual([
      "eventSemester",
      "name",
      "price",
      "startDate",
    ]);
  });
});
