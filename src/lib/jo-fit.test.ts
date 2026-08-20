import { describe, expect, it } from "vitest";
import { computeBestFit } from "./jo-fit";

describe("computeBestFit", () => {
  const questions = [
    { id: "a1", committeeId: "acad" },
    { id: "a2", committeeId: "acad" },
    { id: "a3", committeeId: "acad" },
    { id: "m1", committeeId: "media" },
    { id: "m2", committeeId: "media" },
    { id: "m3", committeeId: "media" },
  ];

  it("sums per committee and ranks highest first", () => {
    const ranked = computeBestFit(
      { a1: 7, a2: 7, a3: 7, m1: 1, m2: 1, m3: 1 },
      questions
    );
    expect(ranked[0]).toEqual({ committeeId: "acad", total: 21 });
    expect(ranked[1]).toEqual({ committeeId: "media", total: 3 });
  });

  it("ignores out-of-range values", () => {
    const ranked = computeBestFit({ a1: 8, a2: 3, a3: 3 }, questions);
    expect(ranked.find((r) => r.committeeId === "acad")?.total).toBe(6);
  });
});
