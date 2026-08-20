/**
 * Upload validation, kept out of the route so it can be tested without standing
 * up a request. See CLEANUP.md §2.6 for what this replaced.
 */

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * What each bucket is allowed to hold. The upload UIs already constrain this
 * (`accept="image/*"` everywhere except the video managers), but an `accept`
 * attribute is a file-picker hint, not a check.
 */
export const BUCKET_KINDS = {
  events: "image",
  eventCard: "image",
  merch: "image",
  videos: "video",
  "membership-proof": "image",
} as const;

export type Bucket = keyof typeof BUCKET_KINDS;
export type Kind = (typeof BUCKET_KINDS)[Bucket];

/** Buckets that must never go through the public `/api/upload` + getPublicUrl path. */
export const PRIVATE_BUCKETS: ReadonlySet<Bucket> = new Set(["membership-proof"]);

export function isBucket(value: unknown): value is Bucket {
  // `value in BUCKET_KINDS` walks the prototype chain, so "constructor" and
  // "toString" passed as valid bucket names. Own-property only.
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(BUCKET_KINDS, value)
  );
}

export function isPrivateBucket(value: unknown): value is Bucket {
  return isBucket(value) && PRIVATE_BUCKETS.has(value);
}

export type Sniffed = { mime: string; ext: string; kind: Kind };

/**
 * Content type read from the bytes, not from the request.
 *
 * The previous version took the extension from `file.name` and passed
 * `file.type` through to Supabase — both caller-controlled — then wrote with
 * `upsert: true` into a public bucket. That let an officer store arbitrary
 * content, HTML and SVG included, on the project's public Supabase origin and
 * have it served with a content type of their choosing.
 *
 * SVG is deliberately absent: it is a script-bearing format, and "an image" that
 * can carry JavaScript is exactly the payload this exists to refuse.
 */
const SIGNATURES: (Sniffed & { test: (b: Buffer) => boolean })[] = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    kind: "image",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    kind: "image",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    ext: "gif",
    kind: "image",
    test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8",
  },
  {
    mime: "image/webp",
    ext: "webp",
    kind: "image",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    // ISO base media: the brand box starts at offset 4. Covers .mp4 and .mov.
    mime: "video/mp4",
    ext: "mp4",
    kind: "video",
    test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    // Matroska / WebM share the EBML magic.
    mime: "video/webm",
    ext: "webm",
    kind: "video",
    test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

/** The sniffed type, or null if the bytes match nothing we accept. */
export function sniff(buffer: Buffer): Sniffed | null {
  if (buffer.length < 12) return null;
  const hit = SIGNATURES.find((s) => s.test(buffer));
  return hit ? { mime: hit.mime, ext: hit.ext, kind: hit.kind } : null;
}

/** Randomised name, extension taken from the sniffed type rather than the caller. */
export function storageName(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}
