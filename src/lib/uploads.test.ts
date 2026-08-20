import { describe, expect, it } from "vitest";
import { BUCKET_KINDS, isBucket, isPrivateBucket, sniff, storageName } from "./uploads";

/** Header bytes only — `sniff` never reads past the first twelve. */
const png = () =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(9)]);
const gif = () => Buffer.concat([Buffer.from("GIF89a", "ascii"), Buffer.alloc(6)]);
const webp = () =>
  Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0, 0, 0, 0]),
    Buffer.from("WEBP", "ascii"),
  ]);
const mp4 = () =>
  Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42", "ascii")]);
const webm = () =>
  Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(8)]);

const ascii = (s: string) => Buffer.from(s, "ascii");

describe("sniff — accepted formats", () => {
  it.each([
    ["png", png(), "image/png", "png", "image"],
    ["jpeg", jpeg(), "image/jpeg", "jpg", "image"],
    ["gif", gif(), "image/gif", "gif", "image"],
    ["webp", webp(), "image/webp", "webp", "image"],
    ["mp4", mp4(), "video/mp4", "mp4", "video"],
    ["webm", webm(), "video/webm", "webm", "video"],
  ])("recognises %s", (_label, bytes, mime, ext, kind) => {
    expect(sniff(bytes as Buffer)).toEqual({ mime, ext, kind });
  });
});

describe("sniff — refusals", () => {
  it("refuses HTML even when the filename and content type claim PNG", () => {
    // The §2.6 payload: extension and Content-Type were both caller-controlled,
    // so the bytes are the only thing worth trusting.
    expect(sniff(ascii("<html><script>alert(1)</script></html>"))).toBeNull();
  });

  it("refuses SVG, which can carry script", () => {
    expect(sniff(ascii('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });

  it("refuses plain text", () => {
    expect(sniff(ascii("just some text, honestly"))).toBeNull();
  });

  it("refuses a buffer too short to hold a signature", () => {
    expect(sniff(Buffer.from([0x89, 0x50, 0x4e]))).toBeNull();
  });

  it("refuses an empty buffer", () => {
    expect(sniff(Buffer.alloc(0))).toBeNull();
  });

  it("refuses a near-miss PNG header", () => {
    const almost = png();
    almost[7] = 0x00; // last byte of the signature corrupted
    expect(sniff(almost)).toBeNull();
  });
});

describe("bucket typing", () => {
  it("accepts the five real buckets", () => {
    for (const b of Object.keys(BUCKET_KINDS)) expect(isBucket(b)).toBe(true);
  });

  it("rejects anything else, including prototype keys", () => {
    for (const b of ["", "Events", "../merch", "constructor", "toString", null, 7]) {
      expect(isBucket(b)).toBe(false);
    }
  });

  it("routes video only to the videos bucket", () => {
    expect(BUCKET_KINDS.videos).toBe("video");
    expect(BUCKET_KINDS.events).toBe("image");
    expect(BUCKET_KINDS.eventCard).toBe("image");
    expect(BUCKET_KINDS.merch).toBe("image");
    expect(BUCKET_KINDS["membership-proof"]).toBe("image");
  });

  it("marks membership-proof as private (no public upload URL path)", () => {
    expect(isPrivateBucket("membership-proof")).toBe(true);
    expect(isPrivateBucket("events")).toBe(false);
    expect(isPrivateBucket("constructor")).toBe(false);
  });
});

describe("storageName", () => {
  it("uses the passed extension and nothing from a filename", () => {
    expect(storageName("png")).toMatch(/^\d+-[a-z0-9]+\.png$/);
  });

  it("does not collide across rapid calls", () => {
    const names = new Set(Array.from({ length: 500 }, () => storageName("jpg")));
    expect(names.size).toBe(500);
  });
});
